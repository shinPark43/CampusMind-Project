import axios from 'axios';
import * as cheerio from 'cheerio';
import { generateEmbedding } from './embeddings.js';
import { URL } from 'url';
import mongoose from 'mongoose';

// Define the schema
const gymSchema = new mongoose.Schema({
  url: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: String,
  pageType: {
    type: String,
    enum: ['hours', 'membership', 'program', 'facility', 'equipment', 'general'],
    required: true
  },
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
  textForEmbedding: { type: String, required: true },
  vector: { type: [Number], required: true },
  lastUpdated: { type: Date, default: Date.now }
});

// Helper function to add random delay
const randomDelay = (min, max) => {
  const delay = Math.floor(Math.random() * (max - min + 1) + min);
  return new Promise(resolve => setTimeout(resolve, delay));
};

// Helper function to clean text
const cleanText = (text) => text.replace(/\s+/g, ' ').trim();

// Set to keep track of visited URLs
const visitedUrls = new Set();
const baseUrl = 'https://www.angelo.edu';

// Function to check if URL is relevant to gym/fitness facilities
const isRelevantUrl = (url) => {
  const relevantKeywords = [
    // Facilities
    'recreation', 'fitness', 'gym', 'workout', 'sports', 'facility',
    'center', 'weight', 'cardio', 'pool', 'track', 'field',
    'court', 'climbing', 'rock wall', 'tennis', 'basketball',
    
    // Programs
    'program', 'class', 'membership', 'intramural', 'club sports',
    'personal training', 'group fitness', 'aquatics',
    
    // Services
    'locker', 'rental', 'equipment', 'towel', 'shower'
  ];
  
  const excludedKeywords = [
    'login', 'signin', 'sign-in', 'password', 'account',
    'donate', 'giving', 'alumni', 'employment', 'job',
    'contact', 'feedback', 'survey'
  ];
  
  const urlLower = url.toLowerCase();
  return relevantKeywords.some(keyword => urlLower.includes(keyword)) &&
         !excludedKeywords.some(keyword => urlLower.includes(keyword));
};

// Function to normalize URL
const normalizeUrl = (url, base) => {
  try {
    const absoluteUrl = new URL(url, base).href;
    return absoluteUrl;
  } catch (error) {
    console.error(`Invalid URL: ${url}`);
    return null;
  }
};

// Function to extract links from a page
const extractLinks = ($, currentUrl) => {
  const links = new Set();
  $('a').each((_, element) => {
    const href = $(element).attr('href');
    if (href) {
      const normalizedUrl = normalizeUrl(href, currentUrl);
      if (normalizedUrl && normalizedUrl.startsWith(baseUrl) && isRelevantUrl(normalizedUrl)) {
        links.add(normalizedUrl);
      }
    }
  });
  return Array.from(links);
};

// Function to determine page type
const determinePageType = (url, $) => {
  const urlLower = url.toLowerCase();
  const content = $('body').text().toLowerCase();
  
  if (urlLower.includes('hours') || content.includes('hours of operation')) {
    return 'hours';
  } else if (urlLower.includes('membership') || content.includes('membership')) {
    return 'membership';
  } else if (urlLower.includes('program') || content.includes('program') || content.includes('class')) {
    return 'program';
  } else if (urlLower.includes('facility') || content.includes('facility')) {
    return 'facility';
  } else if (urlLower.includes('equipment') || content.includes('equipment')) {
    return 'equipment';
  }
  return 'general';
};

// Function to extract facility information
const extractFacilityInfo = ($) => {
  const info = {
    name: $('h1').first().text().trim(),
    description: $('meta[name="description"]').attr('content') || '',
    hours: {},
    features: [],
    rules: [],
    equipment: []
  };

  // Extract hours
  $('table, .hours, .schedule').each((_, element) => {
    const text = $(element).text().toLowerCase();
    if (text.includes('hours') || text.includes('schedule')) {
      const rows = $(element).find('tr');
      rows.each((_, row) => {
        const cells = $(row).find('td, th');
        if (cells.length >= 2) {
          const day = $(cells[0]).text().trim().toLowerCase();
          const time = $(cells[1]).text().trim();
          if (day && time) {
            info.hours[day] = time;
          }
        }
      });
    }
  });

  // Extract features and equipment
  $('ul, ol').each((_, list) => {
    const text = $(list).text().toLowerCase();
    if (text.includes('feature') || text.includes('amenity')) {
      $(list).find('li').each((_, item) => {
        info.features.push($(item).text().trim());
      });
    } else if (text.includes('equipment')) {
      $(list).find('li').each((_, item) => {
        info.equipment.push($(item).text().trim());
      });
    }
  });

  // Extract rules
  $('p, div').each((_, element) => {
    const text = $(element).text().toLowerCase();
    if (text.includes('rule') || text.includes('policy') || text.includes('guideline')) {
      info.rules.push($(element).text().trim());
    }
  });

  return info;
};

// Function to scrape a single page
const scrapePage = async (url, ragConnection) => {
  if (visitedUrls.has(url)) return null;
  visitedUrls.add(url);

  try {
    console.log(`Scraping: ${url}`);
    await randomDelay(2000, 5000);
    
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1'
    };

    const response = await axios.get(url, {
      headers: headers,
      timeout: 10000
    });
    
    await randomDelay(1000, 3000);
    const $ = cheerio.load(response.data);

    // Determine page type and extract specific information
    const pageType = determinePageType(url, $);
    const facilityInfo = extractFacilityInfo($);

    // Create page data object
    const pageData = {
      url,
      title: $('title').text().trim(),
      pageType,
      ...facilityInfo,
      content: cleanText($('main, article, .content').text()),
      headings: $('h1, h2, h3').map((_, el) => $(el).text().trim()).get(),
      lastUpdated: new Date()
    };

    // Generate embedding for the page content
    const textForEmbedding = `
      ${pageData.title}
      ${pageData.description}
      ${Object.entries(pageData.hours).map(([day, time]) => `${day}: ${time}`).join(', ')}
      Features: ${pageData.features.join(', ')}
      Equipment: ${pageData.equipment.join(', ')}
      Rules: ${pageData.rules.join(', ')}
      ${pageData.content}
    `.replace(/\s+/g, ' ').trim();

    pageData.textForEmbedding = textForEmbedding;
    pageData.vector = await generateEmbedding(textForEmbedding);

    // Save to RAG database
    const GymData = ragConnection.model('GymData', gymSchema);
    await GymData.findOneAndUpdate(
      { url: pageData.url },
      pageData,
      { upsert: true, new: true }
    );

    // Extract and return links for further scraping
    return extractLinks($, url);
  } catch (error) {
    console.error(`Error scraping ${url}:`, error);
    return [];
  }
};

// Main scraping function
export async function scrapeGymData(ragConnection) {
  try {
    console.log('Starting to scrape gym data...');
    const startUrl = 'https://www.angelo.edu/life-on-campus/play/university-recreation/';
    
    // Initialize queue with start URL
    let queue = [startUrl];
    let currentDepth = 0;
    const maxDepth = 3; // Limit depth of crawling

    while (queue.length > 0 && currentDepth < maxDepth) {
      const currentBatch = [...queue];
      queue = [];
      
      // Process current batch of URLs
      for (const url of currentBatch) {
        const newLinks = await scrapePage(url, ragConnection);
        if (newLinks) {
          queue.push(...newLinks);
        }
      }
      
      currentDepth++;
      console.log(`Completed depth ${currentDepth}, found ${queue.length} new URLs to scrape`);
    }

    console.log('Gym data scraping completed');
    return {
      totalPagesScraped: visitedUrls.size,
      urls: Array.from(visitedUrls)
    };

  } catch (error) {
    console.error('Error in main scraping function:', error);
    throw error;
  }
} 