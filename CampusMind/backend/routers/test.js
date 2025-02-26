import dotenv from 'dotenv'; // Import dotenv
import axios from 'axios';

// Load environment variables from .env file
dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

// Function to create a new user
const createUser = async (userData) => {
    try {
        const response = await axios.post('http://localhost:3000/createUser', userData); // Use the correct API endpoint
        console.log('User created:', response.data);
    } catch (error) {
        if (error.response) {
            console.error('Error creating user from response.data:', error.response.data);
        } else {
            console.error('Error creating user:', error.message || error);
        }
    }
};

// Example usage
const userData = {
    firstName: 'Again',
    lastName: 'Hi',
    CID: '1234424',
    email: 'again.hi@example.com',
    password: 'password1111'
};

createUser(userData);