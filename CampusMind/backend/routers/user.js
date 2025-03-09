import { Router } from 'express';
import { User } from '../db/db.js'; // Ensure the User model is imported from db.js

const router = Router();

// Create a new user
router.post('/createUser', async (req, res) => {
    try {
        console.log("Received request to create user:", req.body); // Log request body

        const { firstName, lastName, CID, email, password } = req.body; // Destructure the input from the request body

        // Check if the user already exists
        const existingUser = await User.findOne({ email });
        console.log("Existing user found:", existingUser); // Log existing user

        if (existingUser) {
            return res.status(400).send({ error: 'Email already in use. Please use another email.' });
        }

        const user = new User({ 
            first_name: firstName, 
            last_name: lastName, 
            CID: CID, 
            email: email, 
            password: password
        }); // Create a new user
        
        const token = await user.generateAuthToken(); // Generate an authentication token
        await user.save(); // Save the user

        console.log('User created:', user); // Log the user

        res.status(201).send({ user, token }); // Respond with the user and token
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(400).send({ error: error.message }); // Respond with an error
    }
});

router.post('/userLogin', async (req, res) => {
    console.log('Request Body:', req.body); // Debugging log
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).send({ error: 'Missing email or password' });
        }
        const user = await User.findByCredentials(email, password);
        if (!user) {
            return res.status(401).send({ error: 'Login failed! Check authentication credentials' });
        }
        const token = await user.generateAuthToken();
        res.status(200).send({ user, token });
    } catch (error) {
        console.error(error);
        res.status(400).send({ error: 'An error occurred' });
    }
});

export default router;