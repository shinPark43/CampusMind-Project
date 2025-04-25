import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { connectRAGDB, checkDatabaseHealth } from '../db/ragDb.js';

dotenv.config();

async function migrateGymData() {
  try {
    // Connect to RAG database
    const ragConnection = await connectRAGDB();
    console.log('Connected to RAG database');

    // Check database health before migration
    const health = await checkDatabaseHealth();
    console.log('Database Health before migration:', health);

    // Define the old and new schemas
    const oldSchema = new mongoose.Schema({
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

    const newSchema = new mongoose.Schema({
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
            return v.length === 1536;
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

    // Create models
    const OldGymData = ragConnection.model('GymData', oldSchema, 'gymdata');
    const NewGymData = ragConnection.model('NewGymData', newSchema, 'gymdata_new');

    // Get all documents from old collection
    const oldDocuments = await OldGymData.find({});
    console.log(`Found ${oldDocuments.length} documents to migrate`);

    if (oldDocuments.length === 0) {
      console.log('No documents found to migrate. Creating empty collections with new schema.');
      
      // Create empty collections with new schema
      await NewGymData.createCollection();
      console.log('Created new collection with updated schema');
      
      // Close connection
      await ragConnection.close();
      console.log('\nDatabase connection closed');
      return;
    }

    // Create backup of old collection
    const backupCollection = ragConnection.collection('gymdata_backup');
    await backupCollection.insertMany(oldDocuments);
    console.log('Created backup of old collection');

    // Migrate documents
    let migratedCount = 0;
    let errorCount = 0;

    for (const doc of oldDocuments) {
      try {
        // Transform document to new schema
        const newDoc = {
          ...doc.toObject(),
          version: 1,
          metadata: {
            source: new URL(doc.url).hostname,
            crawlDate: doc.lastUpdated,
            lastModified: doc.lastUpdated,
            language: 'en'
          }
        };

        // Validate and save
        const newGymData = new NewGymData(newDoc);
        await newGymData.validate();
        await newGymData.save();
        migratedCount++;
      } catch (error) {
        console.error(`Error migrating document ${doc.url}:`, error.message);
        errorCount++;
      }
    }

    console.log('\nMigration Summary:');
    console.log(`Total documents: ${oldDocuments.length}`);
    console.log(`Successfully migrated: ${migratedCount}`);
    console.log(`Failed migrations: ${errorCount}`);

    // Verify migration
    const newCount = await NewGymData.countDocuments();
    console.log(`\nNew collection document count: ${newCount}`);

    if (migratedCount === oldDocuments.length) {
      console.log('\nMigration successful!');
      console.log('You can now:');
      console.log('1. Verify the data in the new collection');
      console.log('2. Drop the old collection if everything looks good');
      console.log('3. Rename the new collection to the original name');
    } else {
      console.log('\nMigration completed with some errors.');
      console.log('Please review the errors and fix them before proceeding.');
    }

    // Close connection
    await ragConnection.close();
    console.log('\nDatabase connection closed');

  } catch (error) {
    console.error('Error during migration:', error);
    process.exit(1);
  }
}

migrateGymData(); 