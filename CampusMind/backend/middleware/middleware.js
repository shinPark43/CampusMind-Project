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
        // Get the token from the Authorization header
        const token = req.header('Authorization').replace('Bearer ', '');
        
        // Verify the token using the secret key
        const decoded = jwt.verify(token, process.env.JWT_KEY); // Use JWT_KEY
        
        // Find the user by the decoded token and ensure the token is still valid
        // const user = await User.findOne({ _id: decoded._id, 'tokens.token': token });
        const user = await User.findOne({ _id: decoded._id });
        // If no user is found, throw an error
        if (!user) {
            throw new Error();
        }

        // Attach the token and user to the request object
        
        req.user = user;
        
        // Call the next middleware function in the stack
        next();
    } catch (error) {
        // If an error occurs, respond with a 401 status and an error message
        res.status(401).send({ error: 'Please authenticate.' });
    }
};

// Logging middleware
export const logger = (req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
};