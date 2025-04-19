import dotenv from 'dotenv'; // Import dotenv
import express, { urlencoded, json } from 'express';
import userRouter from './routers/user.js'; // Import the user router
import sportEquipmentRouter from './routers/sportEquipment.js'; // Import the sport equipment router
import './db/db.js'; // This will run the code in db.js
import { logger, auth } from './middleware/middleware.js'; // Import the logger and auth middleware
import reservationRouter from './routers/reservation.js'; // Import the reservation router
import forgotPasswordRouter from './routers/forgotpassword.js'; //import the change password router


// Load environment variables from .env file
dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

const port = process.env.PORT || 3000;
console.log('MongoDB URL:', process.env.MONGODB_URL); // Check if it's loaded correctly

const app = express();

app.use(urlencoded({ extended: true }));
app.use(json());
app.use(express.json()); // Middleware to parse JSON data
app.use('/api/auth', forgotPasswordRouter);
app.use(logger); // Use the logger middleware
app.use("/users", userRouter); // Use the user router with the /users prefix
app.use(sportEquipmentRouter); // Use the sport equipment router
app.use("/reservations", reservationRouter); // Use the reservation router with the /reservations prefix

app.listen(port, () => {
    console.log(`Server is up on port ${port}`);
});