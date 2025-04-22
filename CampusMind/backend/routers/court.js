import { Router } from 'express';
import { Court } from '../models/courtModel.js';
import { Sport } from '../models/sportModel.js';
import { auth } from '../middleware/middleware.js';

const router = Router();
router.use(auth);

// Get all courts for a specific sport
router.get('/getCourtsBySport/:sportName', auth, async (req, res) => {
    try {
        const { sportName } = req.params;
        
        // Find the sport by name
        const sport = await Sport.findOne({ sport_name: sportName });
        if (!sport) {
            return res.status(404).json({ error: "Sport not found." });
        }
        
        // Find all courts for this sport
        const courts = await Court.find({ sport_id: sport._id });
        
        res.status(200).json(courts);
    } catch (error) {
        console.error('Error fetching courts:', error.message);
        res.status(500).json({ error: 'An error occurred while fetching courts.' });
    }
});

// Get all courts
router.get('/getAllCourts', auth, async (req, res) => {
    try {
        const courts = await Court.find().populate('sport_id');
        
        // Format the response
        const formattedCourts = courts.map(court => ({
            _id: court._id,
            court_name: court.court_name,
            sport_name: court.sport_id.sport_name,
            is_available: court.is_available
        }));
        
        res.status(200).json(formattedCourts);
    } catch (error) {
        console.error('Error fetching all courts:', error.message);
        res.status(500).json({ error: 'An error occurred while fetching courts.' });
    }
});

// Check court availability for a specific date and time
router.get('/checkCourtAvailability', auth, async (req, res) => {
    try {
        const { courtId, date, startTime, endTime } = req.query;
        
        if (!courtId || !date || !startTime || !endTime) {
            return res.status(400).json({ error: "All parameters (courtId, date, startTime, endTime) are required." });
        }
        
        // Find the court
        const court = await Court.findById(courtId);
        if (!court) {
            return res.status(404).json({ error: "Court not found." });
        }
        
        // Check if the court is available
        if (!court.is_available) {
            return res.status(200).json({ available: false, message: "Court is currently unavailable." });
        }
        
        // Here you would check for existing reservations for this court on this date and time
        // This would require querying the Reservation model
        
        // For now, we'll just return that the court is available
        res.status(200).json({ available: true, message: "Court is available for the specified time." });
    } catch (error) {
        console.error('Error checking court availability:', error.message);
        res.status(500).json({ error: 'An error occurred while checking court availability.' });
    }
});

export default router; 