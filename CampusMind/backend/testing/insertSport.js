import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Sport } from '../models/sportModel.js';

// Load environment variables from .env file
dotenv.config({ path: '../.env' }); // Explicitly specify the path if needed

console.log('NODE_ENV:', process.env.NODE_ENV); // Debugging line
console.log('MONGODB_URL:', process.env.MONGODB_URL); // Debugging line

// MongoDB connection URI from .env
const mongoURI = process.env.MONGODB_URL;

// Connect to MongoDB
mongoose
    .connect(mongoURI, {
        // useNewUrlParser: true,
        // useUnifiedTopology: true,
    })
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.error('Error connecting to MongoDB:', err));

// Array of sports to insert
const sports = [
    { sport_name: 'Badminton' },
    { sport_name: 'Basketball' },
    { sport_name: 'Table Tennis' },
    { sport_name: 'Pickleball' },
];

// Insert sports into the database
const insertSports = async () => {
    try {
        for (const sport of sports) {
            const existingSport = await Sport.findOne({ sport_name: sport.sport_name });
            if (!existingSport) {
                await Sport.create(sport);
                console.log(`Inserted sport: ${sport.sport_name}`);
            } else {
                console.log(`Sport already exists: ${sport.sport_name}`);
            }
        }
        console.log('Sports insertion completed');
    } catch (error) {
        console.error('Error inserting sports:', error);
    } finally {
        mongoose.connection.close();
    }
};

// Run the insertion function
insertSports();