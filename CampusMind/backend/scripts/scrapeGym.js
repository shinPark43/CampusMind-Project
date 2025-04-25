import 'dotenv/config';
import connectRAGDB from '../db/ragDb.js';
import { scrapeGymData } from '../services/scraper.js';

async function main() {
  let ragConnection;
  try {
    // Connect to RAG Database
    ragConnection = await connectRAGDB();
    console.log('Connected to RAG Database');

    // Run the scraper with the RAG connection
    await scrapeGymData(ragConnection);

    // Close the connection
    await ragConnection.close();
    console.log('RAG Database connection closed');
  } catch (error) {
    console.error('Error in main:', error);
    if (ragConnection) {
      await ragConnection.close();
    }
    process.exit(1);
  }
}

main(); 