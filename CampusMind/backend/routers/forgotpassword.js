import express from 'express';
 import crypto from 'crypto';
 import { User } from '../models/userModel.js';
 import { sendPasswordResetEmail } from '../utils/sendemail.js';
 
 const router = express.Router();
 
 router.post('/forgot-password', async (req, res) => {
     console.log("🔔 Forgot Password Route Hit!", req.body);
     const { email } = req.body;
 
     try {
         const user = await User.findOne({ email });
 
         if (!user) {
             return res.status(404).json({ error: 'There is no user with that email in our database, please check spelling and try again.'})
         }
 
         // Generate secure reset token
         const resetToken = crypto.randomBytes(32).toString('hex');
         const resetTokenExpiry = Date.now() + 3600000; // 1 hour from now
 
         // Save token and expiry to user
         user.resetToken = resetToken;
         user.resetTokenExpiry = resetTokenExpiry;
         await user.save();
         console.log("✅ Token saved to user:", user.resetToken);
 
         // Send reset email
         await sendPasswordResetEmail(user.email, resetToken);
 
         res.status(200).json({ message: 'Password reset email sent successfully!' });
     } catch (error) {
         console.error('Error in forgot-password:', error.message);
         res.status(500).json({ error: 'An error occurred while processing your request.' });
     }
 });
 
 router.patch('/reset-password', async (req, res) => {   //This is the actual link in the email, basically this handles some of the reset logic
     const { token, newPassword } = req.body;
     console.log("🔁 Reset Password Body:", req.body);
 
     try {
        console.log("🔍 Looking for user with token:", token);
    
        const user = await User.findOne({
          resetToken: token,
          resetTokenExpiry: { $gt: Date.now() }
        });
    
        console.log("👤 Found user:", user);
        const debugUser = await User.findOne({});
console.log("🔎 Sample user in DB:", debugUser?.resetToken);
        if (!user) {
          return res.status(400).json({ error: 'Invalid or expired reset token.' });
        }
 
         if (!user) {
             return res.status(400).json({ error: 'Invalid or expired reset token.' });
         }
 
         // Update password and clear token fields
         user.password = newPassword; // Will be hashed by pre-save hook
         user.resetToken = null;
         user.resetTokenExpiry = null;
         await user.save();
 
         res.status(200).json({ message: 'Password reset successful!' });
     } catch (error) {
         console.error('Error resetting password:', error.message);
         res.status(500).json({ error: 'An error occurred while resetting the password.' });
     }
 });
 
 export default router;