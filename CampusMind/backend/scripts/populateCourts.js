import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Sport } from '../models/sportModel.js';
import { Court } from '../models/courtModel.js';

// Load environment variables
dotenv.config({ path: '../.env' });

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URL)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Court data with shared court structure
const courtData = [
  // Basketball courts (full courts)
  { 
    sport_name: 'Basketball', 
    courts: [
      { name: 'Court A', shared: true, shared_with: ['Badminton', 'Pickleball'] },
      { name: 'Court B', shared: true, shared_with: ['Badminton', 'Pickleball'] },
      { name: 'Court C', shared: true, shared_with: ['Badminton', 'Pickleball'] },
      { name: 'Court D', shared: true, shared_with: ['Badminton', 'Pickleball'] }
    ] 
  },
  
  // Badminton courts (shared with basketball courts)
  { 
    sport_name: 'Badminton', 
    courts: [
      { name: 'Court A-1', shared: true, shared_with: ['Basketball', 'Pickleball'] },
      { name: 'Court A-2', shared: true, shared_with: ['Basketball', 'Pickleball'] },
      { name: 'Court B-1', shared: true, shared_with: ['Basketball', 'Pickleball'] },
      { name: 'Court B-2', shared: true, shared_with: ['Basketball', 'Pickleball'] },
      { name: 'Court C-1', shared: true, shared_with: ['Basketball', 'Pickleball'] },
      { name: 'Court C-2', shared: true, shared_with: ['Basketball', 'Pickleball'] },
      { name: 'Court D-1', shared: true, shared_with: ['Basketball', 'Pickleball'] },
      { name: 'Court D-2', shared: true, shared_with: ['Basketball', 'Pickleball'] }
    ] 
  },
  
  // Pickleball courts (shared with basketball courts)
  { 
    sport_name: 'Pickleball', 
    courts: [
      { name: 'Court A-1', shared: true, shared_with: ['Basketball', 'Badminton'] },
      { name: 'Court A-2', shared: true, shared_with: ['Basketball', 'Badminton'] },
      { name: 'Court B-1', shared: true, shared_with: ['Basketball', 'Badminton'] },
      { name: 'Court B-2', shared: true, shared_with: ['Basketball', 'Badminton'] },
      { name: 'Court C-1', shared: true, shared_with: ['Basketball', 'Badminton'] },
      { name: 'Court C-2', shared: true, shared_with: ['Basketball', 'Badminton'] },
      { name: 'Court D-1', shared: true, shared_with: ['Basketball', 'Badminton'] },
      { name: 'Court D-2', shared: true, shared_with: ['Basketball', 'Badminton'] }
    ] 
  },
  
  // Table Tennis courts (separate tables)
  { 
    sport_name: 'Table Tennis', 
    courts: [
      { name: 'Table 1', shared: false },
      { name: 'Table 2', shared: false }
    ] 
  }
];

// Function to populate courts
const populateCourts = async () => {
  try {
    // Clear existing courts
    await Court.deleteMany({});
    console.log('Cleared existing courts');
    
    // For each sport, create courts
    for (const sportData of courtData) {
      // Find the sport
      const sport = await Sport.findOne({ sport_name: sportData.sport_name });
      
      if (!sport) {
        console.log(`Sport ${sportData.sport_name} not found, skipping...`);
        continue;
      }
      
      // Create courts for this sport
      for (const courtInfo of sportData.courts) {
        const court = new Court({
          court_name: courtInfo.name,
          sport_id: sport._id,
          is_available: true,
          is_shared: courtInfo.shared || false,
          shared_with: courtInfo.shared_with || []
        });
        
        await court.save();
        console.log(`Created court ${courtInfo.name} for ${sportData.sport_name}`);
      }
    }
    
    console.log('Court population completed successfully');
  } catch (error) {
    console.error('Error populating courts:', error);
  } finally {
    // Close the MongoDB connection
    mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
};

// Run the population function
populateCourts(); 