import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { connectRAGDB, checkDatabaseHealth } from '../db/ragDb.js';

dotenv.config();

async function finalizeMigration() {
  try {
    // Connect to RAG database
    const ragConnection = await connectRAGDB();
    console.log('Connected to RAG database');

    // Check database health
    const health = await checkDatabaseHealth();
    console.log('Database Health:', health);

    // Get collection references
    const oldCollection = ragConnection.collection('gymdata');
    const newCollection = ragConnection.collection('gymdata_new');
    const backupCollection = ragConnection.collection('gymdata_backup');

    // Verify collections exist
    const collections = await ragConnection.db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);

    if (!collectionNames.includes('gymdata_new')) {
      throw new Error('New collection (gymdata_new) not found. Please run the migration script first.');
    }

    // Get counts for verification
    const oldCount = await oldCollection.countDocuments();
    const newCount = await newCollection.countDocuments();
    const backupCount = await backupCollection.countDocuments();

    console.log('\nCollection Status:');
    console.log(`Old collection (gymdata): ${oldCount} documents`);
    console.log(`New collection (gymdata_new): ${newCount} documents`);
    console.log(`Backup collection (gymdata_backup): ${backupCount} documents`);

    // Ask for confirmation
    console.log('\nThis will:');
    console.log('1. Drop the old collection (gymdata)');
    console.log('2. Rename the new collection (gymdata_new) to gymdata');
    console.log('3. Keep the backup collection (gymdata_backup) for safety');

    // In a real scenario, you would ask for user confirmation here
    // For now, we'll proceed with the migration

    // Drop old collection
    await oldCollection.drop();
    console.log('\nDropped old collection');

    // Rename new collection
    await newCollection.rename('gymdata');
    console.log('Renamed new collection to gymdata');

    // Verify final state
    const finalCollections = await ragConnection.db.listCollections().toArray();
    const finalCollectionNames = finalCollections.map(c => c.name);
    const finalCount = await ragConnection.collection('gymdata').countDocuments();

    console.log('\nFinal State:');
    console.log('Collections:', finalCollectionNames);
    console.log(`Documents in gymdata: ${finalCount}`);

    // Close connection
    await ragConnection.close();
    console.log('\nDatabase connection closed');

  } catch (error) {
    console.error('Error during finalization:', error);
    process.exit(1);
  }
}

finalizeMigration(); 