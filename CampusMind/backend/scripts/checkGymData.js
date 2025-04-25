import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectRAGDB from '../db/ragDb.js';

dotenv.config();

async function checkGymData() {
  try {
    // Connect to RAG database
    const ragConnection = await connectRAGDB();
    console.log('Connected to RAG database');

    // Define the schema
    const gymSchema = new mongoose.Schema({
      url: { 
        type: String, 
        required: true, 
        unique: true,
        index: true,
        validate: {
          validator: function(v) {
            return /^https?:\/\/.+\..+/.test(v);
          },
          message: props => `${props.value} is not a valid URL!`
        }
      },
      title: { 
        type: String, 
        required: true,
        text: true
      },
      description: {
        type: String,
        text: true
      },
      pageType: {
        type: String,
        enum: ['hours', 'membership', 'program', 'facility', 'equipment', 'general'],
        required: true,
        index: true
      },
      name: {
        type: String,
        text: true
      },
      hours: {
        type: Map,
        of: String,
        validate: {
          validator: function(v) {
            return Object.keys(v).every(day => 
              ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].includes(day.toLowerCase())
            );
          },
          message: 'Invalid day in hours map'
        }
      },
      features: [{
        type: String,
        text: true
      }],
      equipment: [{
        type: String,
        text: true
      }],
      rules: [{
        type: String,
        text: true
      }],
      content: {
        type: String,
        text: true
      },
      headings: [{
        type: String,
        text: true
      }],
      textForEmbedding: { 
        type: String, 
        required: true,
        text: true
      },
      vector: { 
        type: [Number], 
        required: true,
        validate: {
          validator: function(v) {
            return v.length === 1536; // Assuming OpenAI embeddings dimension
          },
          message: 'Vector must be of dimension 1536'
        }
      },
      lastUpdated: { 
        type: Date, 
        default: Date.now,
        index: true
      },
      version: {
        type: Number,
        default: 1
      },
      metadata: {
        source: String,
        crawlDate: Date,
        lastModified: Date,
        language: {
          type: String,
          default: 'en'
        }
      }
    });

    // Add compound indexes for common query patterns
    gymSchema.index({ pageType: 1, lastUpdated: -1 });
    gymSchema.index({ 'metadata.source': 1, lastUpdated: -1 });

    const GymData = ragConnection.model('GymData', gymSchema);

    // Get all documents
    const documents = await GymData.find({});
    console.log(`\nTotal documents found: ${documents.length}\n`);

    // Group by page type
    const byType = documents.reduce((acc, doc) => {
      acc[doc.pageType] = (acc[doc.pageType] || 0) + 1;
      return acc;
    }, {});

    console.log('Documents by type:');
    Object.entries(byType).forEach(([type, count]) => {
      console.log(`${type}: ${count}`);
    });

    // Show sample of URLs
    console.log('\nSample URLs:');
    documents.slice(0, 5).forEach(doc => {
      console.log(`- ${doc.url} (${doc.pageType})`);
    });

    // Close connection
    await ragConnection.close();
    console.log('\nDatabase connection closed');

  } catch (error) {
    console.error('Error checking gym data:', error);
  }
}

checkGymData(); 