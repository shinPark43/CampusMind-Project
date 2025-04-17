import { Router } from 'express';
import { Reservation } from '../models/reservationModel.js';
import { User } from '../models/userModel.js';
import { Sport } from '../models/sportModel.js';
import jwt from 'jsonwebtoken';
import { auth } from '../middleware/middleware.js'; // Ensure the auth middleware is imported from middleware.js
import mongoose from 'mongoose';

const router = Router();
router.use(auth);

router.post('/createReservation', auth, async (req, res) => {
    try {
        const { sportName, date, time } = req.body;
        console.log("Received data:", sportName, date, time);

        const sport = await Sport.findOne({ sport_name: sportName });
        if (!sport) {
            console.log("Error: Sport not found.");
            return res.status(404).json({ error: "Sport not found." });
        }

        const existingReservation = await Reservation.findOne({ 
            user_id: req.user._id,
            sport_id: sport._id,
            date,
            time 
        });

        if (existingReservation) {
            console.log("Error: You already have a reservation for this game on this date and time.");
            return res.status(400).json({ error: "You already have a reservation for this game on this date and time." });
        }

        const reservation = new Reservation({ 
            user_id: req.user._id, 
            sport_id: sport._id,
            date, 
            time
        });

        await reservation.save();

        console.log("Reservation added successfully!");
        return res.status(201).json({ message: "Reservation added successfully!" });
    } catch (error) {
        console.error("Error adding reservation:", error.message);
        return res.status(500).json({ error: "Internal server error. Please try again later." });
    }
});

router.get('/getUserReservation', auth, async (req, res) => {
    try {
        const userId = req.user._id; // Get the user ID from the token
        const reservations = await Reservation.find({ user_id: userId })
            .populate('sport_id', 'sport_name') 
            .sort({ date: 1, time: 1 }); // Sort by date (ascending) and then by time (ascending)

        // Map the reservations to include only sport_name, date, and time
        const formattedReservations = reservations.map(reservation => ({
            _id: reservation._id,
            sportID : reservation.sport_id._id,
            sportName: reservation.sport_id.sport_name,
            date: reservation.date,
            time: reservation.time
        }));

        console.log("Formatted Reservations (Closest First):", formattedReservations);

        res.json(formattedReservations);
    } catch (error) {
        console.error("Error fetching reservations:", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
});

router.delete('/cancelReservation/:reservationId', auth, async (req, res) => {
    const { reservationId } = req.params; // Extract reservationId from the URL
    const userId = req.user._id; // Get the authenticated user's ID from the token

    console.log(`User ${userId} is attempting to delete reservation ${reservationId}`);

    try {
        // Validate the reservationId
        if (!mongoose.Types.ObjectId.isValid(reservationId)) {
            return res.status(400).json({ error: 'The provided reservation ID is invalid.' });
        }

        // Find the reservation by ID
        const reservation = await Reservation.findById(reservationId);

        if (!reservation) {
            return res.status(404).json({ error: 'Reservation not found' });
        }

        // Check if the user is authorized to delete this reservation
        if (reservation.user_id.toString() !== userId.toString()) {
            return res.status(403).json({ error: 'You are not authorized to delete this reservation' });
        }

        // Delete the reservation
        await reservation.deleteOne();

        console.log(`Reservation ${reservationId} deleted successfully`);
        res.status(200).json({ message: 'Reservation deleted successfully' });
    } catch (error) {
        console.error('Error deleting reservation:', error.message);
        res.status(500).json({ error: 'An error occurred while deleting the reservation' });
    }
});

router.put('/modifyReservation/:reservationId', auth, async (req, res) => {
    const { reservationId } = req.params;
    const { sportName, date, time } = req.body;
    const userId = req.user._id;

    // Validate required fields
    if (!sportName || !date || !time) {
        return res.status(400).json({ error: 'All fields (sportName, date, time) are required.' });
    }

    // Additional validation (e.g., date format, time format)
    if (isNaN(Date.parse(date))) {
        return res.status(400).json({ error: 'Invalid date format.' });
    }

    try {
        const sport = await Sport.findOne({ sport_name: sportName });
        if (!sport) {
            return res.status(404).json({ error: 'Sport not found'});
        }

        const reservation = await Reservation.findById(reservationId);
        if (!reservation) {
            return res.status(404).json({ error: 'Reservation not found'});
        }
        
        if (reservation.user_id.toString() !== userId.toString()) {
            return res.status(403).json({ error: 'You are not authorized to modify this reservation.'});
        }

        reservation.sport_id = sport._id;
        reservation.date = date;
        reservation.time = time;

        await reservation.save();

        res.status(200).json({ message: 'Reservation updated successfully', reservation });
    } catch (error) {
        console.error('Error updating reservation:', error.message);
        res.status(500).json({ error: 'An error occurred while updating the reservation' });
    }
});

export default router;
