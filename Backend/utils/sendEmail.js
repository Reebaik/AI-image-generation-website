const nodemailer = require("nodemailer");

/**
 * Send an email with enhanced HTML support and styling
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} html - HTML content of the email
 * @param {Object} options - Additional email options
 * @returns {Promise<void>}
 */
const sendEmail = async (to, subject, html, options = {}) => {
    // Configure email transporter
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || "smtp.gmail.com",
        port: process.env.EMAIL_PORT || 587,
        secure: process.env.EMAIL_SECURE === "true" ? true : false,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
        tls: {
            rejectUnauthorized: false // Helpful for local development
        }
    });

    // Default sender name
    const senderName = options.senderName || "Aura AI";

    // Default email options
    const mailOptions = {
        from: `"${senderName}" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html,
        headers: {
            'X-Priority': options.priority || '3', // Normal priority by default
            'Importance': options.importance || 'Normal',
            'X-Mailer': 'Aura AI Mailer'
        }
    };

    // Add CC if provided
    if (options.cc) {
        mailOptions.cc = options.cc;
    }

    // Add BCC if provided
    if (options.bcc) {
        mailOptions.bcc = options.bcc;
    }

    // Add attachments if provided
    if (options.attachments) {
        mailOptions.attachments = options.attachments;
    }

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`📧 Email sent successfully to ${to}`);
        console.log(`📬 Message ID: ${info.messageId}`);
        return info;
    } catch (error) {
        console.error("❌ Error sending email:", error);
        throw new Error(`Email sending failed: ${error.message}`);
    }
};

module.exports = sendEmail;
