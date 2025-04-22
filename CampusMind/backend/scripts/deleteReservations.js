import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Reservation } from '../models/reservationModel.js';

// Load environment variables with correct path
dotenv.config({ path: '../.env' });

const deleteAllReservations = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URL);
        console.log('Connected to MongoDB');

        // Delete all reservations
        const result = await Reservation.deleteMany({});
        console.log(`Deleted ${result.deletedCount} reservations`);

        // Disconnect from MongoDB
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');

    } catch (error) {
        console.error('Error deleting reservations:', error);
    }
};

// Run the function
deleteAllReservations(); 