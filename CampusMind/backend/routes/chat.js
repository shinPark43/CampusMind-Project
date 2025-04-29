import express from 'express';
import { connectRAGDB, hoursSchema } from '../db/ragDb.js';
import mongoose from 'mongoose';
import { OpenAI } from 'openai';
import dotenv from 'dotenv';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const router = express.Router();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Connect to RAG database
let GymData;
let Hours;
let ragConnection;

(async () => {
  ragConnection = await connectRAGDB();
  const gymSchema = new mongoose.Schema({
    url: String,
    title: String,
    description: String,
    pageType: String,
    name: String,
    hours: {
      type: Map,
      of: String
    },
    features: [String],
    equipment: [String],
    rules: [String],
    content: String,
    headings: [String],
    textForEmbedding: String,
    vector: [Number],
    lastUpdated: Date
  });
  
  // Create a text index on textForEmbedding and title
  gymSchema.index({ textForEmbedding: 'text', title: 'text', description: 'text' });
  
  GymData = ragConnection.model('GymData', gymSchema);
  Hours = ragConnection.model('Hours', hoursSchema);
  
  // Ensure the text index exists
  try {
    await GymData.collection.createIndex(
      { textForEmbedding: "text", title: "text", description: "text" },
      { name: "text_search_index" }
    );
    console.log("Text search index created or already exists");
  } catch (error) {
    console.error("Error creating text index:", error);
  }
})();

async function searchWeb(query) {
  try {
    const response = await axios.get('https://serpapi.com/search', {
      params: {
        api_key: process.env.SERPAPI_KEY,
        q: query,
        engine: 'google',
        num: 3
      }
    });
    return response.data.organic_results.map(result => ({
      title: result.title,
      snippet: result.snippet,
      link: result.link
    }));
  } catch (error) {
    console.error('Error searching web:', error);
    return [];
  }
}

// Helper function to extract keywords from text
function extractKeywords(text) {
  // Remove common words and punctuation
  const cleanedText = text.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  
  // Remove common stop words
  const stopWords = ['a', 'an', 'the', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 
                    'in', 'on', 'at', 'to', 'for', 'with', 'by', 'about', 'like', 
                    'through', 'over', 'before', 'after', 'between', 'from', 'up', 
                    'down', 'into', 'during', 'until', 'of', 'do', 'does', 'did',
                    'can', 'could', 'would', 'should', 'will', 'shall', 'might',
                    'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them'];
  
  const words = cleanedText.split(' ');
  const keywords = words.filter(word => !stopWords.includes(word) && word.length > 2);
  
  return keywords;
}

router.post('/', async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    // Extract keywords from message
    const keywords = extractKeywords(message);
    console.log("Extracted keywords:", keywords);

    // Check for location keywords
    const locationKeywords = ['chp', 'swimming', 'pool', 'fitness', 'gym', 'center', 'climbing', 'wall', 'bouldering'];
    const mentionedLocation = keywords.find(keyword => 
      locationKeywords.includes(keyword.toLowerCase())
    );

    // Try multiple query strategies
    let relevantDocs = [];
    let hoursData = [];
    let context = '';
    let webResults = null;
    
    // First: Try using MongoDB text search
    try {
      if (keywords.length > 0) {
        const searchQuery = keywords.join(' ');
        const textSearchResults = await GymData.find(
          { $text: { $search: searchQuery } },
          { score: { $meta: "textScore" }, textForEmbedding: 1, title: 1, description: 1, _id: 0 }
        )
        .sort({ score: { $meta: "textScore" } })
        .limit(5);
        
        if (textSearchResults.length > 0) {
          relevantDocs = textSearchResults;
          console.log(`Found ${relevantDocs.length} documents using text search`);
        }
      }
    } catch (error) {
      console.error("Text search error:", error);
    }
    
    // Second: If text search didn't yield results, try keyword matching
    if (relevantDocs.length === 0) {
      try {
        // Create a regex OR query for each keyword
        const regexQueries = keywords.map(keyword => ({
          textForEmbedding: { $regex: keyword, $options: 'i' }
        }));
        
        if (regexQueries.length > 0) {
          const keywordResults = await GymData.find(
            { $or: regexQueries },
            { textForEmbedding: 1, title: 1, description: 1, _id: 0 }
          ).limit(5);
          
          if (keywordResults.length > 0) {
            relevantDocs = keywordResults;
            console.log(`Found ${relevantDocs.length} documents using keyword matching`);
          }
        }
      } catch (error) {
        console.error("Keyword search error:", error);
      }
    }
    
    // Third: Try searching by pageType if keywords suggest a category
    if (relevantDocs.length === 0) {
      const fitnessKeywords = ['workout', 'exercise', 'cardio', 'strength', 'gym', 'weight', 'training', 'fitness', 'nutrition', 'diet', 'protein', 'meal'];
      const sportsKeywords = ['sport', 'game', 'team', 'play', 'competition', 'athletic', 'intramural', 'varsity', 'tournament', 'league'];
      const universityKeywords = ['campus', 'university', 'college', 'asu', 'angelo', 'student', 'academic', 'service', 'facility', 'building', 'location'];
      
      let pageType = null;
      
      if (keywords.some(word => fitnessKeywords.includes(word))) {
        pageType = 'fitness';
      } else if (keywords.some(word => sportsKeywords.includes(word))) {
        pageType = 'sports';
      } else if (keywords.some(word => universityKeywords.includes(word))) {
        pageType = 'general';
      }
      
      if (pageType) {
        try {
          const categoryResults = await GymData.find(
            { pageType: pageType },
            { textForEmbedding: 1, title: 1, description: 1, _id: 0 }
          ).limit(5);
          
          if (categoryResults.length > 0) {
            relevantDocs = categoryResults;
            console.log(`Found ${relevantDocs.length} documents using category matching`);
          }
        } catch (error) {
          console.error("Category search error:", error);
        }
      }
    }

    // Build context from relevant docs
    if (relevantDocs.length > 0) {
      context = relevantDocs
        .map(doc => doc.textForEmbedding)
        .join('\n\n');
    } else {
      // Fallback to web search
      webResults = await searchWeb(`university gym ${message}`);
      if (webResults.length > 0) {
        context = webResults
          .map(result => `${result.title}\n${result.snippet}`)
          .join('\n\n');
      }
    }
    
    // Check if the message is about hours
    const isHoursQuery = keywords.some(keyword => 
      ['hours', 'open', 'close', 'time', 'schedule', 'operating'].includes(keyword.toLowerCase())
    );

    if (isHoursQuery) {
      // Query the Hours collection
      try {
        const currentDate = new Date();
        const currentDay = currentDate.getDate();
        const currentMonth = currentDate.getMonth() + 1; // Months are 0-based
        
        // Build query based on keywords
        const query = {
          date: { $exists: true } // Match any date
        };

        // Check if user asked for this week or next week
        const isThisWeek = keywords.some(keyword => 
          ['this', 'current', 'today', 'now'].includes(keyword.toLowerCase())
        );
        const isNextWeek = keywords.some(keyword => 
          ['next', 'following', 'upcoming'].includes(keyword.toLowerCase())
        );

        // Add location filter if a specific facility is mentioned
        if (mentionedLocation) {
          if (mentionedLocation === 'chp') {
            query.location = 'CHP';
          } else if (mentionedLocation === 'swimming' || mentionedLocation === 'pool') {
            query.location = 'Swimming Pool';
          } else if (mentionedLocation === 'fitness' || mentionedLocation === 'gym' || mentionedLocation === 'center') {
            query.location = 'Fitness Center';
          } else if (mentionedLocation === 'climbing' || mentionedLocation === 'wall' || mentionedLocation === 'bouldering') {
            query.location = 'Climbing Wall';
          }
        }
        
        console.log('Hours query:', query);
        
        // Ensure Hours model is initialized
        if (!Hours) {
          Hours = ragConnection.model('Hours', hoursSchema);
        }
        
        // Get hours data
        let hoursData = await Hours.find(query)
          .sort({ date: -1, timestamp: -1 }) // Sort by date and timestamp in descending order
          .limit(14); // Get more data to ensure we have both weeks
        
        // Filter based on this week or next week
        if (isThisWeek) {
          // Get the most recent week's data
          const uniqueDates = [...new Set(hoursData.map(h => h.date))];
          const mostRecentDate = uniqueDates[0];
          hoursData = hoursData.filter(h => h.date === mostRecentDate);
        } else if (isNextWeek) {
          // Get the second most recent week's data
          const uniqueDates = [...new Set(hoursData.map(h => h.date))];
          const nextWeekDate = uniqueDates[1];
          hoursData = hoursData.filter(h => h.date === nextWeekDate);
        } else {
          // Default to most recent week if no specific week is mentioned
          const uniqueDates = [...new Set(hoursData.map(h => h.date))];
          const mostRecentDate = uniqueDates[0];
          hoursData = hoursData.filter(h => h.date === mostRecentDate);
        }
        
        console.log('Raw hours data:', hoursData);
        
        // Sort the results by day of week after fetching
        const dayOrder = {
          'Monday': 1,
          'Tuesday': 2,
          'Wednesday': 3,
          'Thursday': 4,
          'Friday': 5,
          'Saturday': 6,
          'Sunday': 7
        };
        
        hoursData.sort((a, b) => {
          const dayA = a.day.split(' ')[0]; // Get just the day name
          const dayB = b.day.split(' ')[0];
          const orderA = dayOrder[dayA] || 8; // Default to end if day not found
          const orderB = dayOrder[dayB] || 8;
          return orderA - orderB;
        });
        
        console.log('Sorted hours data:', hoursData);
        
        // Format the hours data for the AI response
        const formattedHours = hoursData.map(record => 
          `Location: ${record.location}
Day: ${record.day}
Hours: ${record.hours}
---`
        ).join('\n');

        console.log('Formatted hours:', formattedHours);

        // Generate response using OpenAI
        const completion = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: `You are a helpful assistant for a university gym. Use the following context to answer questions about the gym facilities, hours, programs, and rules. If the information isn't in the context, say you don't know.

Context:
${context}

Operating Hours:
${formattedHours}

These are the general operating hours for the facility. Do not assume they are specific to any particular activity (like climbing) unless explicitly mentioned in the query. Please use this information to answer any questions about operating hours.`
            },
            {
              role: 'user',
              content: message
            }
          ],
          temperature: 0.7,
          max_tokens: 500,
        });

        console.log('AI Response:', completion.choices[0].message.content);

        res.json({
          response: completion.choices[0].message.content,
          relevantDocs: relevantDocs.map(doc => ({
            text: doc.textForEmbedding,
            title: doc.title,
            score: doc.score || 0,
          })),
          webResults: webResults,
          hoursData: hoursData
        });
      } catch (error) {
        console.error("Hours query error:", error);
        // If there's an error with hours query, still try to get a response
        try {
          const completion = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
              {
                role: 'system',
                content: `You are a helpful assistant for a university gym. Use the following context to answer questions about the gym facilities, hours, programs, and rules. If the information isn't in the context, say you don't know.

Context:
${context}`
              },
              {
                role: 'user',
                content: message
              }
            ],
            temperature: 0.7,
            max_tokens: 500,
          });

          res.json({
            response: completion.choices[0].message.content,
            relevantDocs: relevantDocs.map(doc => ({
              text: doc.textForEmbedding,
              title: doc.title,
              score: doc.score || 0,
            })),
            webResults: webResults,
            hoursData: []
          });
        } catch (error) {
          console.error('Error processing chat request:', error);
          res.status(500).json({ error: 'Internal server error' });
        }
      }
    } else {
      // If not a hours query, proceed with normal response
      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are a helpful assistant for a university gym. Use the following context to answer questions about the gym facilities, hours, programs, and rules. If the information isn't in the context, say you don't know.

Context:
${context}`
          },
          {
            role: 'user',
            content: message
          }
        ],
        temperature: 0.7,
        max_tokens: 500,
      });

      res.json({
        response: completion.choices[0].message.content,
        relevantDocs: relevantDocs.map(doc => ({
          text: doc.textForEmbedding,
          title: doc.title,
          score: doc.score || 0,
        })),
        webResults: webResults,
        hoursData: []
      });
    }
  } catch (error) {
    console.error('Error processing chat request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router; 