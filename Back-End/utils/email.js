// utils/email.js
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

// Load environment variables specifically for this module
dotenv.config();

let transporter;

// Configure Nodemailer based on environment variables
// Ensure EMAIL_USER and EMAIL_PASS are set in your .env file
if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    try {
        transporter = nodemailer.createTransport({
            service: 'gmail', // Or your email provider (e.g., 'Outlook365', 'SendGrid')
            auth: {
                user: process.env.EMAIL_USER, // Your Gmail address or app password user
                pass: process.env.EMAIL_PASS, // Your Gmail app password or actual password (less secure)
            },
            // Optional: Add TLS options for specific providers if needed
            // tls: {
            //     ciphers:'SSLv3'
            // }
        });
        console.log('✅ Nodemailer configured successfully (in utils/email.js)');
    } catch (error) {
        console.error('❌ Failed to configure Nodemailer (in utils/email.js): Check credentials/service.', error);
        transporter = null; // Ensure transporter is null on config error
    }
} else {
    console.warn('⚠️ Email credentials (EMAIL_USER, EMAIL_PASS) not found in .env. Email functionality will be disabled.');
    transporter = null;
}

// Export the sendEmail function
export const sendEmail = async (to, subject, text, html = null) => {
    // Check if transporter was successfully configured
    if (!transporter) {
         console.error('Attempted to send email, but Nodemailer is not configured or failed to initialize.');
         // Throw an error to indicate failure to the calling function
         throw new Error('Email service is not available due to configuration issues.');
    }

    // Define mail options
    let mailOptions = {
        from: `"${process.env.APP_NAME || 'AURORA INTEL'}" <${process.env.EMAIL_USER}>`, // Sender address
        to: to,         // List of receivers (string or array)
        subject: subject, // Subject line
        text: text,       // Plain text body
    };
    // Add HTML body if provided
    if (html) {
        mailOptions.html = html;
    }

    // Attempt to send the email
    try {
        console.log(`Attempting to send email via Nodemailer to: ${to}, Subject: ${subject}`);
        let info = await transporter.sendMail(mailOptions);
        console.log(`✅ Email sent successfully to ${to}! Message ID: ${info.messageId}`);
        return info; // Return details about the sent message
    } catch (err) {
        console.error(`❌ Nodemailer failed to send email to ${to}. Error:`, err);
        // Re-throw the specific error for better debugging in the calling function
        throw new Error(`Failed to send email: ${err.message}`);
    }
};

// You could potentially add other email utility functions here, like sendPasswordResetEmail, etc.