import jwt from 'jsonwebtoken';
import { User } from '../models/userModel.js'; // Ensure the User model is imported from the models folder

// Middleware for reservationSchema
export const reservationMiddleware = (schema) => {
    schema.pre('save', async function(next) {
        const user = await User.findById(this.user_id);
        if (!user) {
            throw new Error('User not found');
        }
        next();
    });
};// don't need this one?

// Authentication middleware
export const auth = async (req, res, next) => {
    try {
      // ✅ Skip auth for known walk-in user ID in backend logic
      const walkInUserId = '680abac7fcd6d4b8e3e805de';
  
      // 🩻 Try to bypass auth if modifying a reservation that belongs to the walk-in user
  if (req.method === "PUT" && req.path.includes("/modifyReservation")) {
    const reservationId = req.params?.reservationId;
    if (reservationId) {
      const reservation = await Reservation.findById(reservationId);
      if (reservation && reservation.user_id.toString() === walkInUserId) {
        console.log("🛑 Skipping auth for walk-in admin mod");
        return next();
      }
    }
  }
  
      const token = req.header('Authorization')?.replace('Bearer ', '');
      if (!token) throw new Error("Missing token");
  
      const decoded = jwt.verify(token, process.env.JWT_KEY);
      const user = await User.findOne({ _id: decoded._id });
  
      if (!user) throw new Error();
  
      req.user = user;
      next();
    } catch (error) {
      res.status(401).send({ error: 'Please authenticate.' });
    }
  };

// Logging middleware
export const logger = (req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
};