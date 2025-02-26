import { Schema, model } from 'mongoose';
import pkg from 'validator';
const { isEmail } = pkg;
import bcrypt from 'bcryptjs';
const { hash, compare } = bcrypt;
import jwt from 'jsonwebtoken';

const userSchema = new Schema({
    first_name: {
        type: String,
        required: true,
        trim: true
    },
    last_name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        validate(value) {
            if (!isEmail(value)) {
                throw new Error('Invalid Email');
            }
        }
    },
    password: {
        type: String,
        required: true,
        trim: true,
        minlength: 8,
    },
    CID: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    tokens: [{
        token: {
            type: String,
            required: true,
            default: [] // Ensures token field is never null
        }
    }]
});

// Pre-save middleware to hash the password
userSchema.pre('save', async function (next) {
    const user = this;
    if (user.isModified('password')) {
        user.password = await hash(user.password, 10);
    }
    next();
});

// Method to generate auth token
userSchema.methods.generateAuthToken = async function() {
    const user = this;

    // Remove any null/undefined tokens to prevent duplicates
    user.tokens = user.tokens.filter(tokenObj => tokenObj.token);

    // Ensure `tokens` is initialized before pushing a new token
    if (!Array.isArray(user.tokens)) {
        user.tokens = [];
    }

    // Generate and save a new token
    const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_KEY);
    user.tokens.push({ token });
    await user.save();

    console.log('New token generated and saved:');
    return token;
};

// Static method to find user by credentials
userSchema.statics.findByCredentials = async (email, password) => {
    // Find the user by email
    const user = await User.findOne({ email });
    if (!user) {
        throw new Error('Login failed! Check authentication credentials');
    }
    // Compare the provided password with the hashed password in the database
    const isPasswordMatch = await compare(password, user.password);
    if (!isPasswordMatch) {
        throw new Error('Login failed! Check authentication credentials');
    }

    return user;
};

const User = model('User', userSchema);

export { User, userSchema };
