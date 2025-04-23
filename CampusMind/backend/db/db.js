import pkg from 'mongoose';
const { connect, Schema, model, models } = pkg;
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken'; // Import jsonwebtoken
import bcrypt from 'bcryptjs'; // Import bcryptjs
import { reservationMiddleware } from '../middleware/middleware.js'; // Import the middleware
import { userSchema } from '../models/userModel.js'; // Import the userSchema

// Load environment variables from .env file
dotenv.config();

const connectDB = async () => {
    const mongoURI = process.env.MONGODB_URL;

    if (!mongoURI) {
        console.error('Error: MONGODB_URL environment variable is not defined.');
        process.exit(1); // Exit process with failure
    }

    try {
        await connect(mongoURI, { 
            dbName: 'CHP', // Database name
            // dbName: 'test', // Database name
            //dbName: 'start_end_time', // Database name
                // useNewUrlParser: true,
                // useCreateIndex: true, 
                // useUnifiedTopology: true 
        });
        console.log('MongoDB connected successfully');
    } catch (error) {
        console.error('Error connecting to MongoDB:', error.message);
        process.exit(1); // Exit process with failure
    }
};

// const sportSchema = new Schema({
//     sport_name: { type: String, required: true, trim: true, unique: true },
// });

// const reservationSchema = new Schema({
//     user_id: { type: Schema.Types.ObjectId, required: true, trim: true, ref: 'User' },
//     sport_id: { type: Schema.Types.ObjectId, required: true, trim: true, ref: 'Sport' },
//     court_id: { type: Schema.Types.ObjectId, required: true, trim: true, ref: 'Court' },
//     date: { type: String, required: true },
//     start_time: { type: String, required: true },
//     end_time: { type: String, required: true },
// });

// Apply middleware to reservationSchema
reservationMiddleware(reservationSchema);

// const sport_equipmentSchema = new Schema({
//     sport_id: { type: Schema.Types.ObjectId, required: true, trim: true, ref: 'Sport' },
//     equipment_name: { type: String, trim: true, required: true },
//     quantity: { type: Number, trim: true, required: true },
// });

// const courtSchema = new Schema({
//     court_name: { type: String, required: true, trim: true },
//     sport_id: { type: Schema.Types.ObjectId, required: true, trim: true, ref: 'Sport' },
//     is_available: { type: Boolean, default: true },
// });

// Check if models already exist before defining them
const User = models.User || model('User', userSchema);
const Sport = models.Sport || model('Sport', sportSchema);
const Reservation = models.Reservation || model('Reservation', reservationSchema);
const SportEquipment = models.SportEquipment || model('SportEquipment', sport_equipmentSchema);
const Court = models.Court || model('Court', courtSchema);

connectDB();

export { User, Sport, Reservation, SportEquipment, Court };