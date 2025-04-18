import { Router } from 'express';
import { User } from '../models/userModel.js'; // Import the User model
import { auth } from '../middleware/middleware.js';

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
        
        
        await user.save(); // Save the user

        console.log('User created:', user); // Log the user

        // res.status(201).send({ user, token }); // Respond with the user and token
        res.status(201).send({ user }); // Respond with the user and token
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
        
        return res.json({ token }); // Respond with the token and client should store it in local storage like await AsyncStorage.setItem("token", data.token); and use it in the headers like await AsyncStorage.getItem("token");
    } catch (error) {
        console.error(error);
        res.status(400).send({ error: 'An error occurred' });
    }
});

// Fetch user profile
router.get('/getUserProfile', auth, async (req, res) => {
    try {
        // Get the authenticated user's ID from the auth middleware
        const userId = req.user._id;

        // Find the user in the database
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Respond with the user's profile data
        res.status(200).json({
            firstName: user.first_name,
            lastName: user.last_name,
            CID: user.CID,
            email: user.email,
        });
    } catch (error) {
        console.error('Error fetching user profile:', error.message);
        res.status(500).json({ error: 'An error occurred while fetching the profile' });
    }
});

// Update user profile
router.put('/updateUserProfile', auth, async (req, res) => {
    const { firstName, lastName, CID, email } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !CID || !email) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        // Get the authenticated user's ID from the auth middleware
        const userId = req.user._id;

        // Find the user in the database
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Update the user's profile fields
        user.first_name = firstName;
        user.last_name = lastName;
        user.CID = CID;
        user.email = email;

        // Save the updated user to the database
        await user.save();

        // Respond with a success message
        res.status(200).json({ message: 'Profile updated successfully' });
    } catch (error) {
        console.error('Error updating profile:', error.message);
        res.status(500).json({ error: 'An error occurred while updating the profile' });
    }
});

export default router;