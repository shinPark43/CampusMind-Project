// import { Schema, model, models } from 'mongoose';
import pkg from 'mongoose';
const { Schema, model, models } = pkg;
import { reservationMiddleware } from '../middleware/middleware.js'; // Import the middleware

const reservationSchema = new Schema({
    // reservation_id: { type: Number, required: true, trim: true, unique: true },
    // user_id: { type: Schema.Types.ObjectId, required: true, trim: true, ref: 'User' },
    user_id: { type: Schema.Types.ObjectId, required: true, trim: true, ref: 'User' },
    sport_id: { type: Schema.Types.ObjectId, required: true, trim: true, ref: 'Sport' },
    date: { type: Date, required: true },
    time: { type: String, required: true },
});

// Apply middleware to reservationSchema
reservationMiddleware(reservationSchema);

const Reservation = models.Reservation || model('Reservation', reservationSchema);

export { Reservation };