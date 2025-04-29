import mongoose from 'mongoose';
import 'dotenv/config';

// Connection options for better performance and reliability
const connectionOptions = {
  maxPoolSize: 10,
  minPoolSize: 5,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 30000,
  serverSelectionTimeoutMS: 30000,
  heartbeatFrequencyMS: 10000,
  retryWrites: true,
  retryReads: true
};

let connection = null;
let Hours = null;

// Schema for storing hours data
const hoursSchema = new mongoose.Schema({
  location: { type: String, required: true },
  date: { type: String, required: true },
  day: { type: String, required: true },
  hours: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

const connectRAGDB = async () => {
  try {
    if (!process.env.MONGODB_RAG_URI) {
      throw new Error('MONGODB_RAG_URI environment variable is not defined');
    }

    // If we already have a connection, return it
    if (connection) {
      return connection;
    }

    // Create new connection with options
    connection = mongoose.createConnection(process.env.MONGODB_RAG_URI, connectionOptions);

    // Set up event listeners
    connection.on('connected', () => {
      console.log(`RAG Database Connected: ${connection.client.s.url}`);
      // Create the Hours model after connection is established
      Hours = connection.model('Hours', hoursSchema);
    });

    connection.on('error', (err) => {
      console.error(`RAG Database Error: ${err.message}`);
    });

    connection.on('disconnected', () => {
      console.log('RAG Database Disconnected');
    });

    // Handle process termination
    process.on('SIGINT', async () => {
      try {
        await connection.close();
        console.log('RAG Database connection closed through app termination');
        process.exit(0);
      } catch (err) {
        console.error('Error closing database connection:', err);
        process.exit(1);
      }
    });

    return connection;
  } catch (error) {
    console.error(`RAG Database Error: ${error.message}`);
    process.exit(1);
  }
};

// Add health check method
const checkDatabaseHealth = async () => {
  try {
    if (!connection) {
      return { status: 'disconnected', message: 'No active connection' };
    }

    // Wait for the connection to be ready
    await new Promise((resolve) => {
      if (connection.readyState === 1) {
        resolve();
      } else {
        connection.once('connected', resolve);
      }
    });

    const db = connection.db;
    const stats = await db.stats();
    
    return {
      status: 'connected',
      database: stats.db,
      collections: stats.collections,
      documents: stats.objects,
      storageSize: stats.storageSize
    };
  } catch (error) {
    return { status: 'error', message: error.message };
  }
};

export { connectRAGDB, Hours, hoursSchema, checkDatabaseHealth }; 