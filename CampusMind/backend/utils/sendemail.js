//This is the fle that sends emails to users and lets them change their password
import postmark from 'postmark';
 
//Postmarkserver APIKEY
const client = new postmark.ServerClient(process.env.POSTMARK_API_KEY);

/**
 * Sends a password reset email
 */
export const sendPasswordResetEmail = async (to, resetToken) => {
    try {
        const resetUrl = `https://scaling-waddle-wr5q6qrrvv7x254pr-3000.app.github.dev/reset-password?token=${resetToken}`;
        
        await client.sendEmail({
            From: "campusmind@resetpassword.xyz",
            To: to,
            Subject: "Password Reset Request",
            TextBody: `You requested a password reset. Click the link to reset your password: ${resetUrl}`,
            HtmlBody: `
            <p>You requested a password reset.</p>
            <p>Click the button below to reset your password:</p>
            <a href="${resetUrl}"" style="background-color:#4CAF50;color:white;padding:10px 15px;text-decoration:none;border-radius:5px;">Reset Password</a>
            <p>If you did not request this, please ignore this email.</p>
        `
        });

        console.log("✅ Reset email sent to:", to);
    } catch (error) {
        console.error("❌ Failed to send email:", error.message);
        throw error;
    }
};