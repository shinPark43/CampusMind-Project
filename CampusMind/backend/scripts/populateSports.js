import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Sport } from '../models/sportModel.js';

// Load environment variables
dotenv.config({ path: '../.env' });

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URL)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Sports data
const sportsData = [
    { sport_name: 'Basketball' },
    { sport_name: 'Badminton' },
    { sport_name: 'Pickleball' },
    { sport_name: 'Table Tennis' }
];

// Function to populate sports
const populateSports = async () => {
    try {
        // Clear existing sports
        await Sport.deleteMany({});
        console.log('Cleared existing sports');

        // Create new sports
        for (const sportData of sportsData) {
            const sport = new Sport({
                sport_name: sportData.sport_name
            });
            await sport.save();
            console.log(`Created sport: ${sportData.sport_name}`);
        }

        console.log('Sports population completed successfully');
    } catch (error) {
        console.error('Error populating sports:', error);
    } finally {
        // Close the MongoDB connection
        mongoose.connection.close();
        console.log('MongoDB connection closed');
    }
};

// Run the population function
populateSports(); 