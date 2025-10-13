const nodemailer = require('nodemailer');
const emailConfig = require('../config/email.config');
const logger = require('../utils/logger');

// Create reusable transporter object using SMTP transport
let transporter = null;

const createTransporter = () => {
    if (!transporter) {
        // Validate required email configuration
        if (!emailConfig.HOST || !emailConfig.PORT || !emailConfig.USER || !emailConfig.PASSWORD) {
            logger.error('Missing required email configuration:', {
                hasHost: !!emailConfig.HOST,
                hasPort: !!emailConfig.PORT,
                hasUser: !!emailConfig.USER,
                hasPassword: !!emailConfig.PASSWORD,
                passwordLength: emailConfig.PASSWORD ? emailConfig.PASSWORD.length : 0,
                passwordStartsWith: emailConfig.PASSWORD ? emailConfig.PASSWORD.substring(0, 3) : 'N/A'
            });
            throw new Error('Email service is not properly configured. Please check environment variables.');
        }

        const transportConfig = {
            host: emailConfig.HOST,
            port: parseInt(emailConfig.PORT),
            secure: emailConfig.SECURE, // true for 465, false for other ports
            auth: {
                user: emailConfig.USER,
                pass: emailConfig.PASSWORD,
            },
            // Additional options for better reliability
            tls: {
                rejectUnauthorized: false // For self-signed certificates
            },
            // Add debugging
            logger: process.env.NODE_ENV === 'development' ? true : false,
            debug: process.env.NODE_ENV === 'development' ? true : false,
        };

        logger.info('Creating email transporter with config:', {
            host: transportConfig.host,
            port: transportConfig.port,
            secure: transportConfig.secure,
            user: transportConfig.auth.user,
            passwordConfigured: !!transportConfig.auth.pass,
            passwordLength: transportConfig.auth.pass ? transportConfig.auth.pass.length : 0
        });

        transporter = nodemailer.createTransport(transportConfig);
    }
    return transporter;
};

// Verify transporter configuration
const verifyConnection = async () => {
    try {
        const transporter = createTransporter();
        await transporter.verify();
        logger.info('Email service is ready to send messages');
        return true;
    } catch (error) {
        logger.error('Email service configuration error:', error);
        return false;
    }
};

// Send email function
const sendEmail = async ({ to, subject, text, html }) => {
    try {
        const transporter = createTransporter();

        const mailOptions = {
            from: `"${emailConfig.FROM_NAME}" <${emailConfig.FROM_EMAIL}>`,
            to,
            subject,
            text,
            html: html || text
        };

        const info = await transporter.sendMail(mailOptions);

        logger.info('Email sent successfully:', {
            messageId: info.messageId,
            to: to,
            subject: subject
        });

        return {
            success: true,
            messageId: info.messageId
        };
    } catch (error) {
        logger.error('Error sending email:', {
            to: to,
            subject: subject,
            error: error.message
        });

        throw new Error(`Failed to send email: ${error.message}`);
    }
};

// Send OTP email
const sendOTPEmail = async (email, otp, name = 'User') => {
    const subject = 'Password Reset OTP - BUDDyDESK';

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .container {
          background-color: #f9f9f9;
          border-radius: 10px;
          padding: 30px;
          box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .header h1 {
          color: #4CAF50;
          margin: 0;
        }
        .otp-box {
          background-color: #fff;
          border: 2px dashed #4CAF50;
          border-radius: 8px;
          padding: 20px;
          text-align: center;
          margin: 20px 0;
        }
        .otp-code {
          font-size: 32px;
          font-weight: bold;
          color: #4CAF50;
          letter-spacing: 8px;
          margin: 10px 0;
        }
        .warning {
          background-color: #fff3cd;
          border-left: 4px solid #ffc107;
          padding: 12px;
          margin: 20px 0;
          border-radius: 4px;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #ddd;
          color: #666;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔐 Password Reset Request</h1>
        </div>
        
        <p>Hello <strong>${name}</strong>,</p>
        
        <p>We received a request to reset your BUDDyDESK account password. Use the OTP below to complete the password reset process:</p>
        
        <div class="otp-box">
          <p style="margin: 0; color: #666; font-size: 14px;">Your OTP Code:</p>
          <div class="otp-code">${otp}</div>
          <p style="margin: 0; color: #999; font-size: 12px;">Valid for 10 minutes</p>
        </div>
        
        <div class="warning">
          <strong>⚠️ Security Notice:</strong>
          <ul style="margin: 10px 0; padding-left: 20px;">
            <li>This OTP is valid for 10 minutes only</li>
            <li>Never share this OTP with anyone</li>
            <li>BUDDyDESK will never ask for your OTP via phone or email</li>
            <li>If you didn't request this, please ignore this email</li>
          </ul>
        </div>
        
        <p>If you didn't request a password reset, please ignore this email or contact our support team if you have concerns about your account security.</p>
        
        <div class="footer">
          <p><strong>BUDDyDESK Team</strong></p>
          <p>This is an automated message, please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;

    const text = `
    Password Reset OTP - BUDDyDESK
    
    Hello ${name},
    
    We received a request to reset your BUDDyDESK account password.
    
    Your OTP Code: ${otp}
    
    This OTP is valid for 10 minutes only.
    
    Security Notice:
    - Never share this OTP with anyone
    - BUDDyDESK will never ask for your OTP via phone or email
    - If you didn't request this, please ignore this email
    
    If you have any concerns about your account security, please contact our support team.
    
    Best regards,
    BUDDyDESK Team
  `;

    return sendEmail({ to: email, subject, text, html });
};

// Send welcome email
const sendWelcomeEmail = async (email, name) => {
    const subject = 'Welcome to BUDDyDESK!';

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .container {
          background-color: #f9f9f9;
          border-radius: 10px;
          padding: 30px;
        }
        .header {
          text-align: center;
          color: #4CAF50;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to BUDDyDESK! 🎉</h1>
        </div>
        <p>Hello <strong>${name}</strong>,</p>
        <p>Thank you for joining BUDDyDESK! We're excited to have you on board.</p>
        <p>Get started by completing your profile and connecting with other professionals.</p>
        <p>Best regards,<br>The BUDDyDESK Team</p>
      </div>
    </body>
    </html>
  `;

    const text = `Welcome to BUDDyDESK! Hello ${name}, Thank you for joining BUDDyDESK!`;

    return sendEmail({ to: email, subject, text, html });
};

// Send password changed confirmation email
const sendPasswordChangedEmail = async (email, name) => {
    const subject = 'Password Changed Successfully - BUDDyDESK';

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .container {
          background-color: #f9f9f9;
          border-radius: 10px;
          padding: 30px;
        }
        .header {
          text-align: center;
          color: #4CAF50;
        }
        .alert {
          background-color: #d4edda;
          border-left: 4px solid #28a745;
          padding: 12px;
          margin: 20px 0;
          border-radius: 4px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ Password Changed Successfully</h1>
        </div>
        <p>Hello <strong>${name}</strong>,</p>
        <div class="alert">
          <p><strong>Your password has been changed successfully.</strong></p>
        </div>
        <p>If you didn't make this change, please contact our support team immediately.</p>
        <p>Best regards,<br>The BUDDyDESK Team</p>
      </div>
    </body>
    </html>
  `;

    const text = `Password Changed Successfully. Hello ${name}, Your BUDDyDESK account password has been changed successfully. If you didn't make this change, please contact our support team immediately.`;

    return sendEmail({ to: email, subject, text, html });
};

module.exports = {
    sendEmail,
    sendOTPEmail,
    sendWelcomeEmail,
    sendPasswordChangedEmail,
    verifyConnection
};

