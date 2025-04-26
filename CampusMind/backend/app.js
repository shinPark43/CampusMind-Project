import dotenv from 'dotenv'; // Import dotenv
import express, { urlencoded, json } from 'express';
import userRouter from './routers/user.js'; // Import the user router
import sportEquipmentRouter from './routers/sportEquipment.js'; // Import the sport equipment router
import './db/db.js'; // This will run the code in db.js
import { logger, auth } from './middleware/middleware.js'; // Import the logger and auth middleware
import reservationRouter from './routers/reservation.js'; // Import the reservation router
import forgotPasswordRouter from './routers/forgotpassword.js'; //import the change password router
import courtRouter from './routers/court.js'; // Import the court router
import chatRouter from './routes/chat.js'; // Import the chat router


// Load environment variables from .env file
dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

const port = process.env.PORT || 3000;
console.log('MongoDB URL:', process.env.MONGODB_URL); // Check if it's loaded correctly

const app = express();

// Middleware
app.use(json());
app.use(urlencoded({ extended: true }));

// Add CORS middleware
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

// Root route for testing
app.get('/', (req, res) => {
    res.json({ message: 'Backend server is running' });
});

// Mount routers
app.use('/api/users', userRouter); // Mount user router at /api/users
app.use('/api/sportEquipment', sportEquipmentRouter);
app.use('/api/reservations', reservationRouter);
app.use('/api/forgot-password', forgotPasswordRouter);
app.use('/api/courts', courtRouter);
app.use('/api/chat', chatRouter);

app.use(logger); // Use the logger middleware

app.listen(port, () => {
    console.log(`Server is up on port ${port}`);
});