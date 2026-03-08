import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create a reusable transporter object using the default SMTP transport for Office 365
const transporter = nodemailer.createTransport({
    host: 'smtp.office365.com',
    port: 587,
    secure: false, // true for 465, false for 587
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    tls: {
        ciphers: 'SSLv3',       // Essential for some Office 365 setups
        rejectUnauthorized: false // Can be useful for local tests, but try to keep true in prod if possible
    }
});

/**
 * Verify the connection configuration immediately so we know if Office 365 auth failed.
 */
transporter.verify(function (error, success) {
    if (error) {
        console.error("❌ Office 365 SMTP Connection Error: ", error.message);
        console.error("Make sure EMAIL_USER and EMAIL_PASS are correct App Passwords.");
    } else {
        console.log("✅ Office 365 SMTP Server is ready to take our messages");
    }
});

/**
 * Sends a booking notification email to the Coach and/or Client.
 * 
 * @param {Object} data 
 * @param {string} data.to - Destination email address
 * @param {string} data.subject - Email subject
 * @param {string} data.html - HTML string containing the email body
 */
export const sendEmail = async ({ to, subject, html }) => {
    try {
        const fromAddress = process.env.EMAIL_FROM || process.env.EMAIL_USER;

        const info = await transporter.sendMail({
            from: `"NovaWork Global" <${fromAddress}>`,
            to,
            subject,
            html,
        });

        console.log(`Email sent successfully to ${to}. Message ID: ${info.messageId}`);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error(`Error sending email to ${to}: `, error);
        return { success: false, error: error.message };
    }
};

/**
 * Pre-configured template for sending Coaching Booking Confirmations.
 */
export const sendBookingNotification = async (clientData, coachData, sessionData) => {
    // 1. Send Email to the Coach
    const coachHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
            <h2 style="color: #2563eb;">New Session Booked! 🎉</h2>
            <p>Hi <strong>${coachData.full_name}</strong>,</p>
            <p><strong>${clientData.full_name}</strong> has just booked a new coaching session with you.</p>
            
            <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 5px 0;"><strong>Session Type:</strong> ${sessionData.session_type}</p>
                <p style="margin: 5px 0;"><strong>Scheduled For:</strong> ${new Date(sessionData.scheduled_at).toLocaleString()}</p>
                <p style="margin: 5px 0;"><strong>Duration:</strong> ${sessionData.duration_minutes} minutes</p>
                <p style="margin: 5px 0;"><strong>Client Email:</strong> <a href="mailto:${clientData.email}">${clientData.email}</a></p>
            </div>
            
            <p>Please log in to your NovaWork Global Dashboard to review the details and prepare for the session.</p>
            <br/>
            <p style="color: #64748b; font-size: 12px;">This is an automated message from NovaWork Global.</p>
        </div>
    `;

    // 2. Send Email to the Client
    const clientHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
            <h2 style="color: #2563eb;">Your Session is Confirmed! ✅</h2>
            <p>Hi <strong>${clientData.full_name}</strong>,</p>
            <p>Your coaching session with <strong>${coachData.full_name}</strong> has been successfully booked.</p>
            
            <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 5px 0;"><strong>Session Type:</strong> ${sessionData.session_type}</p>
                <p style="margin: 5px 0;"><strong>Scheduled For:</strong> ${new Date(sessionData.scheduled_at).toLocaleString()}</p>
                <p style="margin: 5px 0;"><strong>Duration:</strong> ${sessionData.duration_minutes} minutes</p>
            </div>
            
            <p>Get ready for your session! You can log in to your dashboard at any time to review your goals.</p>
            <br/>
            <p style="color: #64748b; font-size: 12px;">This is an automated message from NovaWork Global.</p>
        </div>
    `;

    try {
        // Send asynchronously to both
        const promises = [];
        if (coachData.email) {
            promises.push(sendEmail({
                to: coachData.email,
                subject: `New Booking: ${clientData.full_name} - NovaWork Global`,
                html: coachHtml
            }));
        }

        if (clientData.email) {
            promises.push(sendEmail({
                to: clientData.email,
                subject: `Session Confirmed with ${coachData.full_name} - NovaWork Global`,
                html: clientHtml
            }));
        }

        await Promise.all(promises);
        return { success: true };
    } catch (error) {
        console.error("Failed to send booking notifications:", error);
        return { success: false, error: error.message };
    }
};
