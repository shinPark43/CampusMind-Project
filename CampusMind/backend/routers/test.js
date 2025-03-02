import dotenv from 'dotenv'; // Import dotenv
import axios from 'axios';

// Load environment variables from .env file
dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

// Function to create a new user
const createUser = async (userData) => {
    try {
        const response = await axios.post('http://192.168.1.167:3000/createUser', userData); // Use the correct API endpoint
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
    firstName: 'Hiiiiii',
    lastName: 'Heeeey',
    CID: '51513563',
    email: 'hiiiiii.heeeey@example.com',
    password: 'password2115'
};

createUser(userData);