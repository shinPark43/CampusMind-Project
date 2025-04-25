import express from 'express';
import { connectRAGDB } from '../db/ragDb.js';
import mongoose from 'mongoose';
import { OpenAI } from 'openai';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const router = express.Router();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Connect to RAG database
let GymData;
(async () => {
  const ragConnection = await connectRAGDB();
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

    // Try multiple query strategies
    let relevantDocs = [];
    
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

    let context = '';
    let webResults = null;

    if (relevantDocs.length > 0) {
      // Use RAG database results
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

    // Generate response using OpenAI
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
      webResults: webResults
    });
  } catch (error) {
    console.error('Error processing chat request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router; 