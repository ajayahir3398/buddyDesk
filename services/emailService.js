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
            logger: true,
            debug: true,
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
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f8f9fa;
        }
        .container {
          background-color: #ffffff;
          border-radius: 15px;
          padding: 40px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .header h1 {
          color: #2c3e50;
          font-size: 28px;
          margin: 0;
          font-weight: bold;
        }
        .brand-name {
          color: #3498db;
          font-weight: bold;
          font-size: 24px;
        }
        .tribe-name {
          color: #e74c3c;
          font-weight: bold;
        }
        .greeting {
          font-size: 18px;
          margin-bottom: 20px;
        }
        .intro-text {
          font-size: 16px;
          margin-bottom: 25px;
          color: #555;
        }
        .features {
          background-color: #f8f9fa;
          border-radius: 10px;
          padding: 25px;
          margin: 25px 0;
        }
        .features h3 {
          color: #2c3e50;
          margin-top: 0;
          margin-bottom: 15px;
        }
        .feature-item {
          margin: 12px 0;
          font-size: 16px;
          color: #555;
        }
        .cta-section {
          text-align: center;
          margin: 30px 0;
        }
        .cta-button {
          display: inline-block;
          background-color: #3498db;
          color: white;
          padding: 15px 30px;
          text-decoration: none;
          border-radius: 25px;
          font-weight: bold;
          font-size: 16px;
          transition: background-color 0.3s;
        }
        .cta-button:hover {
          background-color: #2980b9;
        }
        .community-text {
          font-style: italic;
          color: #7f8c8d;
          margin: 20px 0;
          text-align: center;
        }
        .support-section {
          background-color: #ecf0f1;
          border-radius: 10px;
          padding: 20px;
          margin: 25px 0;
          text-align: center;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 2px solid #ecf0f1;
          color: #7f8c8d;
        }
        .footer .team-name {
          color: #2c3e50;
          font-weight: bold;
          font-size: 18px;
        }
        .footer .powered-by {
          color: #95a5a6;
          font-size: 14px;
          margin-top: 10px;
        }
        .emoji {
          font-size: 20px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Hey <span class="tribe-name">${name}</span>! <span class="emoji">👋</span></h1>
          <p class="brand-name">Welcome to 𝐁𝐔𝐃𝐃𝐲𝐃𝐄𝐒𝐊</p>
        </div>
        
        <p class="intro-text">the world where learning meets sharing - and where every skill matters.</p>
        
        <p class="intro-text">You're now officially a <span class="tribe-name">𝐁𝐮𝐝𝐝𝐲𝐃𝐞𝐬𝐤𝐢𝐚𝐧</span> - part of a growing movement of creators, learners, and changemakers who believe in skill over currency. <span class="emoji">🌍</span></p>
        
        <div class="features">
          <h3>Here's what you can start doing right away:</h3>
          <div class="feature-item"><span class="emoji">✨</span> Create your profile - tell the world what you can teach.</div>
          <div class="feature-item"><span class="emoji">📸</span> Post your skills - show your talent, projects, or creativity.</div>
          <div class="feature-item"><span class="emoji">🤝</span> Connect & collaborate - find your learning buddy or teaching match within your area.</div>
        </div>
        
        <p class="community-text">At <span class="brand-name">𝐁𝐔𝐃𝐃𝐲𝐃𝐄𝐒𝐊</span>, you don't just join an app - you join a community powered by skills, passion, and purpose.</p>
        
        <div class="cta-section">
          <a href="http://buddydesk.in/" class="cta-button">Your journey begins here →</a>
        </div>
        
        <div class="support-section">
          <p>If you ever need help, we're always here for you at <strong>apps@buddydesk.in</strong></p>
        </div>
        
        <p style="text-align: center; font-size: 18px; color: #2c3e50; margin: 25px 0;">Let's make skill-sharing the new trend.</p>
        
        <p style="text-align: center; font-size: 16px; color: #3498db; margin: 20px 0;">Welcome to the tribe, <span class="tribe-name">𝐁𝐮𝐝𝐝𝐲𝐃𝐞𝐬𝐤𝐢𝐚𝐧</span>! <span class="emoji">💙</span></p>
        
        <div class="footer">
          <p class="team-name">Warm regards,<br>Team BuddyDesk</p>
          <p class="powered-by">Powered by 7Sisters</p>
        </div>
      </div>
    </body>
    </html>
  `;

    const text = `
Hey ${name}! 👋

Welcome to BUDDyDESK, the world where learning meets sharing - and where every skill matters.

You're now officially a BuddyDeskian - part of a growing movement of creators, learners, and changemakers who believe in skill over currency. 🌍

Here's what you can start doing right away:
✨ Create your profile - tell the world what you can teach.
📸 Post your skills - show your talent, projects, or creativity.
🤝 Connect & collaborate - find your learning buddy or teaching match within your area.

At BUDDyDESK, you don't just join an app - you join a community powered by skills, passion, and purpose.

Your journey begins here → http://buddydesk.in/

If you ever need help, we're always here for you at apps@buddydesk.in

Let's make skill-sharing the new trend.

Welcome to the tribe, BuddyDeskian! 💙

Warm regards,
Team BuddyDesk
Powered by 7Sisters
  `;

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

// Send email verification OTP
const sendEmailVerificationOTP = async (email, name, otp) => {
    const subject = 'Email Verification OTP - BUDDyDESK';

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
        .otp-code {
          background-color: #4CAF50;
          color: white;
          font-size: 24px;
          font-weight: bold;
          text-align: center;
          padding: 15px;
          border-radius: 5px;
          margin: 20px 0;
          letter-spacing: 3px;
        }
        .security-notice {
          background-color: #fff3cd;
          border: 1px solid #ffeaa7;
          border-radius: 5px;
          padding: 15px;
          margin: 20px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Email Verification - BUDDyDESK</h1>
        </div>
        <p>Hello <strong>${name}</strong>,</p>
        <p>Thank you for registering with BUDDyDESK! To complete your registration, please verify your email address using the OTP code below:</p>
        
        <div class="otp-code">${otp}</div>
        
        <p><strong>This OTP is valid for 10 minutes only.</strong></p>
        
        <div class="security-notice">
          <h3>🔒 Security Notice:</h3>
          <ul>
            <li>Never share this OTP with anyone</li>
            <li>BUDDyDESK will never ask for your OTP via phone or email</li>
            <li>If you didn't request this verification, please ignore this email</li>
          </ul>
        </div>
        
        <p>If you have any concerns about your account security, please contact our support team.</p>
        
        <p>Best regards,<br>The BUDDyDESK Team</p>
      </div>
    </body>
    </html>
  `;

    const text = `
    Email Verification OTP - BUDDyDESK
    
    Hello ${name},
    
    Thank you for registering with BUDDyDESK! To complete your registration, please verify your email address using the OTP code below:
    
    Your OTP Code: ${otp}
    
    This OTP is valid for 10 minutes only.
    
    Security Notice:
    - Never share this OTP with anyone
    - BUDDyDESK will never ask for your OTP via phone or email
    - If you didn't request this verification, please ignore this email
    
    If you have any concerns about your account security, please contact our support team.
    
    Best regards,
    BUDDyDESK Team
  `;

    return sendEmail({ to: email, subject, text, html });
};

module.exports = {
    sendEmail,
    sendOTPEmail,
    sendWelcomeEmail,
    sendPasswordChangedEmail,
    sendEmailVerificationOTP,
    verifyConnection
};

