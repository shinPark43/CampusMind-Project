import { Router } from 'express';
import { Reservation } from '../models/reservationModel.js';
import { User } from '../models/userModel.js';
import { Sport } from '../models/sportModel.js';
import jwt from 'jsonwebtoken';
import { auth } from '../middleware/middleware.js'; // Ensure the auth middleware is imported from middleware.js

const router = Router();

router.post('/createReservation', auth, async (req, res) => {
    try {
        const { sportName, date, time } = req.body;
        console.log("Received data:", sportName, date, time);
        // // const token = req.body.token;
        const sport = await Sport.findOne({ sport_name: sportName });
        if (!sport) {
            console.log("Error: Sport not found.");
            return res.status(404).json({ error: "Sport not found." });
        }
        const existingReservation = await Reservation.findOne({ 
            user_id: req.user._id,
            sport_id: sport._id,
            // sportName,
            date,
            time 
        })

        if (existingReservation) {
            console.log("Error: You already have a reservation for this game on this date and time.");
            return;
        }

        const reservation = new Reservation({ 
            user_id: req.user._id, 
            sport_id: sport._id,
            // sportName, 
            date, 
            time
        });

        await reservation.save();

        console.log("Reservation added successfully!");
    } catch (error) {
        console.error("Error adding reservation:", error.message);
    }

});


export default router;
