import { Router } from 'express';
import { Reservation } from '../models/reservationModel.js';
import { User } from '../models/userModel.js';
import { Sport } from '../models/sportModel.js';
import { Court } from '../models/courtModel.js';
import jwt from 'jsonwebtoken';
import { auth } from '../middleware/middleware.js'; // Ensure the auth middleware is imported from middleware.js
import mongoose from 'mongoose';
import moment from 'moment-timezone';

const router = Router();
router.use(auth);

router.post('/createReservation', auth, async (req, res) => {
    try {
        const { sportName, courtName, date, time } = req.body;
        console.log("Received data:", sportName, courtName, date, time);

        // Verify if the user exists in the database
        const user = await User.findById(req.user._id);
        if (!user) {
            console.log("Unauthorized access attempt: User not found");
            return res.status(403).json({ error: "Unauthorized access. User not found in the system." });
        }

        const sport = await Sport.findOne({ sport_name: sportName });
        if (!sport) {
            console.log("Error: Sport not found.");
            return res.status(404).json({ error: "Sport not found." });
        }

        // Find the court by name and sport_id
        const court = await Court.findOne({ court_name: courtName, sport_id: sport._id });
        if (!court) {
            console.log("Error: Court not found for this sport.");
            return res.status(404).json({ error: "Court not found for this sport." });
        }

        // Check if the court is available
        if (!court.is_available) {
            console.log("Error: Court is currently unavailable.");
            return res.status(400).json({ error: "Court is currently unavailable." });
        }

        // Validate required fields
        if (!sportName || !courtName || !date || !time) {
            console.log("Error: All fields (sportName, courtName, date, time) are required.");
            return res.status(400).json({ error: "All fields (sportName, courtName, date, time) are required." });
        }

        // Additional validation (e.g., date format, time format)
        if (isNaN(Date.parse(date))) {
            console.log("Error: Invalid date format.");
            return res.status(400).json({ error: "Invalid date format." });
        }

        // Parse the time range (e.g., "1:30 PM - 2:30 PM")
        const timeRegex = /^(\d{1,2}:\d{2}\s?[APMapm]{2})\s*-\s*(\d{1,2}:\d{2}\s?[APMapm]{2})$/;
        const match = time.match(timeRegex);

        if (!match) {
            console.log("Error: Invalid time format. Expected format is 'HH:MM AM/PM - HH:MM AM/PM'.");
            return res.status(400).json({ error: "Invalid time format. Expected format is 'HH:MM AM/PM - HH:MM AM/PM'." });
        }

        const [_, startTime, endTime] = match;

        // Convert start and end times to 24-hour format (HH:MM)
        const startTime24 = moment(startTime, ["h:mm A"]).format("HH:mm");
        const endTime24 = moment(endTime, ["h:mm A"]).format("HH:mm");

        // Define the Central Time (CT) time zone
        const centralTimeZone = 'America/Chicago';

        // Convert today's date to Central Time
        const today = moment.tz(new Date(), centralTimeZone).startOf('day');

        // Combine reservation date and start time into a single datetime
        const reservationDateTime = moment.tz(`${date} ${startTime24}`, 'YYYY-MM-DD HH:mm', centralTimeZone);

        // Compare reservation date with today's date
        if (reservationDateTime.isBefore(today)) {
            console.log("Error: Reservation date must be in the future.");
            return res.status(400).json({ error: "Reservation date must be in the future." });
        }
        
        const existingReservation = await Reservation.findOne({ 
            user_id: req.user._id,
            sport_id: sport._id,
            court_id: court._id,
            date,
            start_time: startTime24,
            end_time: endTime24, 
        });

        if (existingReservation) {
            console.log("Error: You already have a reservation for this game on this date and time.");
            return res.status(400).json({ error: "You already have a reservation for this game on this date and time." });
        }

        // Check for conflicting reservations for the same court
        const conflictingReservation = await Reservation.findOne({
            court_id: court._id,
            date,
            $or: [
                { start_time: { $lt: endTime24 }, end_time: { $gt: startTime24 } }, // Overlaps with existing reservation
            ],
        });

        if (conflictingReservation) {
            console.log("Error: Time conflict with an existing reservation for this court.");
            return res.status(400).json({ error: "Time conflict with an existing reservation for this court." });
        }

        const reservation = new Reservation({ 
            user_id: req.user._id, 
            sport_id: sport._id,
            court_id: court._id,
            date, 
            start_time: startTime24,
            end_time: endTime24,
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
        const userId = req.user._id;

        // Fetch reservations for the user with proper population
        const reservations = await Reservation.find({ user_id: userId })
            .populate({
                path: 'sport_id',
                select: 'sport_name'
            })
            .populate({
                path: 'court_id',
                select: 'court_name'
            });

        if (!reservations) {
            return res.status(200).json([]);
        }

        // Format the response
        const formattedReservations = reservations.map((reservation) => {
            // Ensure all required fields exist
            if (!reservation.sport_id || !reservation.court_id) {
                console.error('Missing populated data for reservation:', reservation._id);
                return null;
            }

            // Format time in 12-hour format with AM/PM
            const startTime = moment(reservation.start_time, 'HH:mm').format('h:mm A');
            const endTime = moment(reservation.end_time, 'HH:mm').format('h:mm A');

            return {
                _id: reservation._id,
                sportName: reservation.sport_id.sport_name,
                courtName: reservation.court_id.court_name,
                date: reservation.date,
                time: `${startTime} - ${endTime}`,
            };
        }).filter(Boolean); // Remove any null entries

        res.status(200).json(formattedReservations);
    } catch (error) {
        console.error('Error fetching reservations:', error);
        res.status(500).json({ error: 'An error occurred while fetching reservations.' });
    }
});

router.delete('/cancelReservation/:reservationId', auth, async (req, res) => {
    const { reservationId } = req.params;
    const userId = req.user._id;

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

router.get('/checkCourtAvailability', auth, async (req, res) => {
    try {
        const { sportName, date, startTime, endTime } = req.query;
        
        if (!sportName || !date || !startTime || !endTime) {
            return res.status(400).json({ error: "All parameters (sportName, date, startTime, endTime) are required." });
        }
        
        // Find the sport by name
        const sport = await Sport.findOne({ sport_name: sportName });
        if (!sport) {
            return res.status(404).json({ error: "Sport not found." });
        }
        
        // Find all courts for this sport
        const courts = await Court.find({ sport_id: sport._id });
        
        // Get the main court names (e.g., "A" from "A-1", "A-2")
        const mainCourtNames = courts.map(court => {
            const parts = court.court_name.split('-');
            return parts[0]; // Get the main court name (e.g., "A" from "A-1")
        });
        
        // Find all courts that share the same physical space
        const sharedCourts = await Court.find({
            $or: [
                { court_name: { $in: mainCourtNames } }, // Main courts
                { court_name: { $regex: `^(${mainCourtNames.join('|')})-` } } // Sub-courts
            ]
        });
        
        // Get all reservations for courts in the same physical space
        const reservations = await Reservation.find({
            court_id: { $in: sharedCourts.map(court => court._id) },
            date: date,
            $or: [
                { start_time: { $lt: endTime }, end_time: { $gt: startTime } }
            ]
        }).populate('sport_id').populate('court_id');
        
        // Create a map of physical spaces to their reservations
        const spaceReservations = {};
        reservations.forEach(reservation => {
            const mainCourtName = reservation.court_id.court_name.split('-')[0];
            if (!spaceReservations[mainCourtName]) {
                spaceReservations[mainCourtName] = [];
            }
            spaceReservations[mainCourtName].push({
                start_time: reservation.start_time,
                end_time: reservation.end_time,
                sport_name: reservation.sport_id.sport_name,
                court_name: reservation.court_id.court_name
            });
        });
        
        // Filter out courts that are in spaces that are already reserved
        const availableCourts = courts.filter(court => {
            const mainCourtName = court.court_name.split('-')[0];
            const isBasketball = sportName === 'Basketball';
            
            // If the space has no reservations, it's available
            if (!spaceReservations[mainCourtName]) {
                return true;
            }
            
            // For basketball, check ALL reservations in the space
            if (isBasketball) {
                return !spaceReservations[mainCourtName].some(reservation => {
                    // For basketball, any reservation in this space makes it unavailable
                    return (
                        (reservation.start_time < endTime && reservation.end_time > startTime)
                    );
                });
            }
            
            // For other sports, check only full court and same sub-court reservations
            return !spaceReservations[mainCourtName].some(reservation => {
                if (reservation.court_name === mainCourtName || // Full court reservation
                    reservation.court_name === court.court_name) { // Same sub-court reservation
                    return (
                        (reservation.start_time < endTime && reservation.end_time > startTime)
                    );
                }
                return false;
            });
        });
        
        // Format the response
        const formattedCourts = availableCourts.map(court => ({
            _id: court._id,
            court_name: court.court_name,
            is_shared: court.is_shared,
            shared_with: court.shared_with,
            sport_id: court.sport_id
        }));
        
        res.status(200).json(formattedCourts);
    } catch (error) {
        console.error('Error checking court availability:', error.message);
        res.status(500).json({ error: 'An error occurred while checking court availability.' });
    }
});

export default router;
