import { Router } from 'express';
import { Reservation } from '../models/reservationModel.js';
import { Sport } from '../models/sportModel.js';
import moment from 'moment-timezone';
/*This file does not do anything anymore, as you can see it is half commented and nothing is broken, But I am afraid to delete it because 
computers have mood swings and somthing may break if I do, he who has courage, let him delete it 

const router = Router();

router.put('/modifyWalkIn/:reservationId', async (req, res) => {
  console.log("🛠️ Hit the modifyWalkIn route!");
  const { reservationId } = req.params;
  const { sportName, date, time } = req.body;

  try {
    if (!sportName || !date || !time) {
      return res.status(400).json({ error: 'All fields (sportName, date, time) are required.' });
    }

    const sport = await Sport.findOne({ sport_name: sportName });
    if (!sport) return res.status(404).json({ error: 'Sport not found' });

    const reservation = await Reservation.findById(reservationId);
    if (!reservation) return res.status(404).json({ error: 'Reservation not found' });

    if (isNaN(Date.parse(date))) {
      return res.status(400).json({ error: 'Invalid date format.' });
    }

    const timeRegex = /^(\d{1,2}:\d{2}\s?[APMapm]{2})\s*-\s*(\d{1,2}:\d{2}\s?[APMapm]{2})$/;
    const match = time.match(timeRegex);
    if (!match) {
      return res.status(400).json({ error: "Invalid time format." });
    }

    const [, startTime, endTime] = match;
    const startTime24 = moment(startTime, ['h:mm A']).format('HH:mm');
    const endTime24 = moment(endTime, ['h:mm A']).format('HH:mm');

    const conflict = await Reservation.findOne({
      sport_id: sport._id,
      date,
      _id: { $ne: reservationId },
      $or: [
        { start_time: { $lt: endTime24 }, end_time: { $gt: startTime24 } }
      ]
    });

    if (conflict) {
      return res.status(400).json({ error: 'Time conflict with an existing reservation.' });
    }

    reservation.sport_id = sport._id;
    reservation.date = date;
    reservation.start_time = startTime24;
    reservation.end_time = endTime24;

    await reservation.save();

    res.status(200).json({ message: 'Walk-in reservation updated successfully!', reservation });

  } catch (err) {
    console.error('Error updating walk-in reservation:', err.message);
    res.status(500).json({ error: 'Something went wrong while updating the reservation.' });
  }
});
/*router.put('/modifyWalkIn/:reservationId', async (req, res) => {
    console.log("🛠️ Hit the modifyWalkIn route!");
    const { reservationId } = req.params;
    const { sportName, date, time } = req.body;

    try {
        if (!sportName || !date || !time) {
            return res.status(400).json({ error: 'All fields (sportName, date, time) are required.' });
        }

        const sport = await Sport.findOne({ sport_name: sportName });
        if (!sport) return res.status(404).json({ error: 'Sport not found' });

        const reservation = await Reservation.findById(reservationId);
        if (!reservation) return res.status(404).json({ error: 'Reservation not found' });

        if (isNaN(Date.parse(date))) {
            return res.status(400).json({ error: 'Invalid date format.' });
        }

        const timeRegex = /^(\d{1,2}:\d{2}\s?[APMapm]{2})\s*-\s*(\d{1,2}:\d{2}\s?[APMapm]{2})$/;
        const match = time.match(timeRegex);
        if (!match) {
            return res.status(400).json({ error: "Invalid time format. Expected 'HH:MM AM/PM - HH:MM AM/PM'." });
        }

        const [, startTime, endTime] = match;

        // ✅ Now validating start and end time directly
        if (!startTime || !endTime) {
            return res.status(400).json({ error: 'Start time and end time are required.' });
        }

        const startTime24 = moment(startTime, ['h:mm A']).format('HH:mm');
        const endTime24 = moment(endTime, ['h:mm A']).format('HH:mm');

        const conflict = await Reservation.findOne({
            sport_id: sport._id,
            date,
            _id: { $ne: reservationId },
            $or: [
                { start_time: { $lt: endTime24 }, end_time: { $gt: startTime24 } }
            ]
        });

        if (conflict) {
            return res.status(400).json({ error: 'Time conflict with an existing reservation.' });
        }

        reservation.sport_id = sport._id;
        reservation.date = date;
        reservation.start_time = startTime24;
        reservation.end_time = endTime24;

        await reservation.save();

        res.status(200).json({ message: 'Walk-in reservation updated successfully!', reservation });

    } catch (err) {
        console.error('Error updating walk-in reservation:', err.message);
        res.status(500).json({ error: 'Something went wrong while updating the reservation.' });
    }
});*/
export default router;