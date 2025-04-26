import { Router } from 'express';
import { Reservation } from '../models/reservationModel.js';
import { User } from '../models/userModel.js';
import { Sport } from '../models/sportModel.js';
import jwt from 'jsonwebtoken';
import { auth } from '../middleware/middleware.js'; // Ensure the auth middleware is imported from middleware.js
import mongoose from 'mongoose';
import moment from 'moment-timezone';


const router = Router();

router.delete('/cleanup', async (req, res) => {
  try {
    const now = new Date();
    const fiveDaysAgo = new Date(now);
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5); // 5 days before today
    const fiveDaysAgoDate = fiveDaysAgo.toISOString().split('T')[0]; // format: YYYY-MM-DD

    const deleted = await Reservation.deleteMany({
      date: { $lt: fiveDaysAgoDate } // only delete dates *older* than 5 days ago
    });

    res.status(200).json({ message: 'Old reservations (5+ days ago) deleted.', deletedCount: deleted.deletedCount });
  } catch (error) {
    console.error('Cleanup error:', error.message);
    res.status(500).json({ error: 'Failed to clean up reservations.' });
  }
});



router.post('/createWalkIn', async (req, res) => {
    console.log("🛠️ Hit the createwalkin reservation.js route!");
    try {

        const { sportName, date, time } = req.body;

        const walkInUserId = '680abac7fcd6d4b8e3e805de'; // 🔒 Walk-in user ID
        const sport = await Sport.findOne({ sport_name: sportName });

        if (!sport) return res.status(404).json({ error: 'Sport not found.' });
        if (!sportName || !date || !time) return res.status(400).json({ error: 'Missing required fields.' });

        const timeRegex = /^(\d{1,2}:\d{2}\s?[APMapm]{2})\s*-\s*(\d{1,2}:\d{2}\s?[APMapm]{2})$/;
        const match = time.match(timeRegex);
        if (!match) return res.status(400).json({ error: 'Invalid time format.' });

        const [, startTime, endTime] = match;
        const startTime24 = moment(startTime, ['h:mm A']).format('HH:mm');
        const endTime24 = moment(endTime, ['h:mm A']).format('HH:mm');

        // 🛑 Conflict check
        const conflict = await Reservation.findOne({
            sport_id: sport._id,
            date,
            $or: [
                { start_time: { $lt: endTime24 }, end_time: { $gt: startTime24 } }
            ]
        });

        if (conflict) return res.status(400).json({ error: "Oppsie, someone else is playing at that time, try picking something else" });

        const reservation = new Reservation({
          user_id: walkInUserId,
          sport_id: sport._id,
          date,
          start_time: startTime24,
          end_time: endTime24,
          userName: req.body.userName || "Walk-in reservation" // ✅ ADD THIS LINE
      });
        await reservation.save();
        res.status(201).json({ message: 'Walk-in reservation created!' });

    } catch (err) {
        console.error('Walk-in error:', err.message);
        res.status(500).json({ error: 'Something went wrong while creating walk-in reservation.' });
    }
});

router.get('/by-date', async (req, res) => {
    console.log("🛠️ Hit the bydatereservation.js route!");
    try {
      const { date } = req.query;
  
      const reservations = await Reservation.find({ date })
        .populate('sport_id')
        .populate('user_id');
  
        const formatted = reservations.map((res) => ({
            _id: res._id,
            sportName: res.sport_id?.sport_name || "Unknown",
            time: `${moment(res.start_time, 'HH:mm').format('h:mm A')} - ${moment(res.end_time, 'HH:mm').format('h:mm A')}`,
            userName: res.user_id?.first_name
  ? `${res.user_id.first_name} ${res.user_id.last_name}`
  : res.userName || "Walk-in reservation",
            isWalkIn: !res.user_id?.first_name, // ✅ ← this must be here
          }));
  
      res.status(200).json(formatted);
    } catch (err) {
      console.error("Error fetching reservations:", err.message);
      res.status(500).json({ error: "Failed to fetch reservations." });
    }
  });

  router.delete('/cancelReservation/:reservationId', async (req, res) => {
    console.log("🛠️ Hit the cancelreservationreservation.js route!");
    const { reservationId } = req.params;
  
    console.log(`Deleting reservation with ID: ${reservationId}`);
  
    try {
      if (!mongoose.Types.ObjectId.isValid(reservationId)) {
        return res.status(400).json({ error: 'The provided reservation ID is invalid.' });
      }
  
      const reservation = await Reservation.findById(reservationId);
      if (!reservation) {
        return res.status(404).json({ error: 'Reservation not found' });
      }
  
      await reservation.deleteOne();
      console.log(`Reservation ${reservationId} deleted successfully`);
      res.status(200).json({ message: 'Reservation deleted successfully' });
    } catch (error) {
      console.error('Error deleting reservation:', error.message);
      res.status(500).json({ error: 'An error occurred while deleting the reservation' });
    }
  });
  
  router.put('/modifyReservation/:reservationId', async (req, res, next) => {
    req.isAdminOverride = req.headers['x-admin-request'] === 'true';
    if (!req.isAdminOverride) return auth(req, res, next);
    next();
  }, async (req, res) => {
    console.log("🛠️ Hit the modifyReservation route!");
  
    const { reservationId } = req.params;
    const { sportName, date, time } = req.body;
    const userId = req.user?._id || null;
  
    try {
      if (!sportName || !date || !time) {
        return res.status(400).json({ error: 'All fields (sportName, date, time) are required.' });
      }
  
      const sport = await Sport.findOne({ sport_name: sportName });
      if (!sport) {
        return res.status(404).json({ error: 'Sport not found' });
      }
  
      const reservation = await Reservation.findById(reservationId);
      if (!reservation) {
        return res.status(404).json({ error: 'Reservation not found' });
      }
  
      if (!req.isAdminOverride && reservation.user_id.toString() !== userId?.toString()) {
        return res.status(403).json({ error: 'You are not authorized to modify this reservation.' });
      }
  
      // validation...
      const match = time.match(/^(\d{1,2}:\d{2}\s?[APMapm]{2})\s*-\s*(\d{1,2}:\d{2}\s?[APMapm]{2})$/);
      if (!match) {
        return res.status(400).json({ error: "Invalid time format." });
      }
      const [, startTime, endTime] = match;
      const startTime24 = moment(startTime, ["h:mm A"]).format("HH:mm");
      const endTime24 = moment(endTime, ["h:mm A"]).format("HH:mm");
  
      const conflict = await Reservation.findOne({
        sport_id: sport._id,
        date,
        _id: { $ne: reservationId },
        $or: [{ start_time: { $lt: endTime24 }, end_time: { $gt: startTime24 } }],
      });
  
      if (conflict) {
        return res.status(400).json({ error: 'Time conflict with an existing reservation.' });
      }
  
      reservation.sport_id = sport._id;
      reservation.date = date;
      reservation.start_time = startTime24;
      reservation.end_time = endTime24;
      await reservation.save();
  
      res.status(200).json({ message: 'Reservation updated successfully', reservation });
  
    } catch (err) {
      console.error("Update error:", err.message);
      res.status(500).json({ error: "An error occurred while updating the reservation" });
    }
  });

  router.use((req, res, next) => {
    // Only protect /modifyReservation
    if (
        req.path.startsWith("/modifyReservation") ||
        req.path.startsWith("/cancelReservation")
      ) {
        // Bypass auth for Admin walk-ins
        const isAdminRequest = req.headers["x-admin-request"] === "true";
        if (!isAdminRequest) {
          return auth(req, res, next);
        }
      }
  });

router.post('/createReservation', auth, async (req, res) => {
  console.log("Received create reservation request with body:", req.body);
    try {
        console.log("🛠️ Hit the createreservation,regularusers,reservation.js route!");
        const { sportName, date, time } = req.body;
        console.log("Received data:", sportName, date, time);

        // Verify if the user exists in the database
        const user = await User.findById(req.user._id);
        if (!user) {
            console.log("Unauthorized access attempt: User not found");
            return res.status(403).json({ error: "Unauthorized access. User not found in the system." });
        }

        const sport = await Sport.findOne({ sport_name: sportName });
        // console.log("1. Sport found:", sport);
        if (!sport) {
            console.log("Error: Sport not found.");
            return res.status(404).json({ error: "Sport not found." });
        }

        // Validate required fields
        if (!sportName || !date || !time) {
            console.log("Error: All fields (sportName, date, time) are required.");
            return res.status(400).json({ error: "All fields (sportName, date, time) are required." });
        }

        // Additional validation (e.g., date format, time format)
        if (isNaN(Date.parse(date))) {
            console.log("Error: Invalid date format.");
            return res.status(400).json({ error: "Invalid date format." });
        }

        // console.log("4. Date parsed successfully:", date);
        // console.log("5. Time received:", time);

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

        console.log("Start time (24-hour format):", startTime24);
        console.log("End time (24-hour format):", endTime24);

        // Define the Central Time (CT) time zone
        const centralTimeZone = 'America/Chicago';

        // Convert today's date to Central Time
        const today = moment.tz(new Date(), centralTimeZone).startOf('day');
        console.log("Today's date (CT):", today.format());

        // Combine reservation date and start time into a single datetime
        const reservationDateTime = moment.tz(`${date} ${startTime24}`, 'YYYY-MM-DD HH:mm', centralTimeZone);
        console.log("Reservation date and time (CT):", reservationDateTime.format());

        // Compare reservation date with today's date
        if (reservationDateTime.isBefore(today)) {
            console.log("Error: Reservation date must be in the future.");
            return res.status(400).json({ error: "Reservation date must be in the future." });
        }
        
       // console.log("6. Is revervation date after today:", reservationDateTime.isAfter(today));
        
        const existingReservation = await Reservation.findOne({ 
            user_id: req.user._id,
            sport_id: sport._id,
            date,
            start_time: startTime24,
            end_time: endTime24, 
        });

        if (existingReservation) {
            console.log("Error: You already have a reservation for this game on this date and time.");
            return res.status(400).json({ error: "You already have a reservation for this game on this date and time." });
        }

        // Check for conflicting reservations
        const conflictingReservation = await Reservation.findOne({
            sport_id: sport._id,
            date,
            $or: [
                { start_time: { $lt: endTime24 }, end_time: { $gt: startTime24 } }, // Overlaps with existing reservation
            ],
        });

        if (conflictingReservation) {
            console.log("Error: Time conflict with an existing reservation.");
            return res.status(400).json({ error: "Time conflict with an existing reservation for the same sport." });
        }

        const reservation = new Reservation({ 
            user_id: req.user._id, 
            sport_id: sport._id,
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
    console.log("🛠️ Hit the getreservationreqularuserreseration.js route!");
    try {
        const userId = req.user._id;

        // Fetch reservations for the user
        const reservations = await Reservation.find({ user_id: userId }).populate('sport_id');

        // Format start_time and end_time into "H:MM AM/PM - H:MM AM/PM"
        const formattedReservations = reservations.map((reservation) => ({
            _id: reservation._id,
            sportName: reservation.sport_id.sport_name,
            date: reservation.date,
            time: `${moment(reservation.start_time, 'HH:mm').format('h:mm A')} - ${moment(reservation.end_time, 'HH:mm').format('h:mm A')}`,
        }));

        res.status(200).json(formattedReservations);
    } catch (error) {
        console.error('Error fetching reservations:', error.message);
        res.status(500).json({ error: 'An error occurred while fetching reservations.' });
    }
});





export default router;
