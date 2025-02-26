import { Router } from 'express';
import { SportEquipment, Reservation } from '../db/db.js'; // Ensure the SportEquipment and Reservation models are imported from db.js

const router = Router();

// Get specific sport quantity and equipment, and check available time and date
router.get('/sportEquipment/:sportId', async (req, res) => {
    try {
        const { sportId } = req.params; // Get the sport ID from the request parameters
        const equipment = await SportEquipment.find({ sport_id: sportId }); // Find the equipment for the specified sport

        if (!equipment || equipment.length === 0) {
            return res.status(404).send({ error: 'Sport equipment not found' });
        }

        // Check if the equipment quantity is 0
        if (equipment[0].quantity === 0) {
            return res.status(200).send({ equipment, message: 'Cannot book more, equipment is empty or already booked all' });
        }

        const reservations = await Reservation.find({ sport_id: sportId }); // Find reservations for the specified sport

        if (reservations.length === 0) {
            return res.status(200).send({ equipment, message: 'All times and dates are available' });
        }

        const availableTimes = reservations.map(reservation => ({
            date: reservation.date,
            time: reservation.time
        }));

        res.status(200).send({ equipment, availableTimes }); // Respond with the equipment details and available times
    } catch (error) {
        res.status(400).send({ error: 'Error retrieving sport equipment and availability' }); // Respond with an error
    }
});

// Book sport equipment and update quantity
router.post('/bookEquipment', async (req, res) => {
    try {
        const { userId, sportId, date, time } = req.body; // Destructure the input from the request body

        // Find the equipment for the specified sport
        const equipment = await SportEquipment.findOne({ sport_id: sportId });

        if (!equipment) {
            return res.status(404).send({ error: 'Sport equipment not found' });
        }

        // Check if the equipment quantity is greater than 0
        if (equipment.quantity <= 0) {
            return res.status(400).send({ error: 'Booking is full or equipment is full' });
        }

        // Create a new reservation
        const reservation = new Reservation({ user_id: userId, sport_id: sportId, date, time });
        await reservation.save();

        // Update the equipment quantity
        equipment.quantity -= 1;
        await equipment.save();

        res.status(200).send({ message: 'Booking successful', reservation }); // Respond with the reservation details
    } catch (error) {
        res.status(400).send({ error: 'Error booking equipment' }); // Respond with an error
    }
});

export default router; // Ensure the router is exported as the default export
