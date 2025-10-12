const { Resend } = require('resend');

// Initialize Resend with API key from environment variable
const resend = new Resend(process.env.EMAIL_API_KEY);

/**
 * Send password reset email
 * @param {string} to - Recipient email address
 * @param {string} resetToken - Password reset token
 * @param {string} userName - User's name
 * @returns {Promise} - Resend API response
 */
const sendPasswordResetEmail = async (to, resetToken, userName) => {
  try {
    // Generate reset link - Web URL that tries to open app, falls back to web form
    // Use BACKEND_URL for the base URL (without /api), fallback to PRODUCTION_URL without /api
    let backendUrl = process.env.NODE_ENV === 'production' ? process.env.CORS_ORIGIN_PRODUCTION : 'http://localhost:3000';

    const resetLink = `${backendUrl}/reset-password.html?token=${resetToken}`;
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password</title>
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
            margin-top: 20px;
          }
          .header {
            text-align: center;
            padding-bottom: 20px;
            border-bottom: 2px solid #4CAF50;
          }
          .header h1 {
            color: #4CAF50;
            margin: 0;
          }
          .content {
            padding: 20px 0;
          }
          .button {
            display: inline-block;
            padding: 12px 30px;
            background-color: #4CAF50;
            color: white !important;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
            text-align: center;
          }
          .button:hover {
            background-color: #45a049;
          }
          .footer {
            text-align: center;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            margin-top: 20px;
            color: #777;
            font-size: 12px;
          }
          .warning {
            background-color: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 10px;
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Password Reset Request</h1>
          </div>
          
          <div class="content">
            <p>Hi ${userName},</p>
            
            <p>We received a request to reset your password for your BuddyDesk account.</p>
            
            <p>Click the button below to reset your password:</p>
            
            <div style="text-align: center;">
              <a href="${resetLink}" class="button">Reset Password</a>
            </div>
            
            <p>Or copy and paste this link into your browser:</p>
            <p style="background-color: #f4f4f4; padding: 10px; border-radius: 5px; word-break: break-all;">
              ${resetLink}
            </p>
            
            <p><strong>What happens next:</strong></p>
            <ul style="margin-left: 20px; line-height: 1.8;">
              <li>If you have our mobile app installed, it will open automatically</li>
              <li>If not, you can reset your password in your web browser</li>
            </ul>
            
            <div class="warning">
              <strong>⚠️ Important:</strong> This link will expire in 1 hour for security reasons.
            </div>
            
            <p>If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
            
            <p>Best regards,<br>The BuddyDesk Team</p>
          </div>
          
          <div class="footer">
            <p>This is an automated email. Please do not reply to this message.</p>
            <p>&copy; ${new Date().getFullYear()} BuddyDesk. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const response = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'BuddyDesk <onboarding@resend.dev>',
      to: to,
      subject: 'Reset Your BuddyDesk Password',
      html: htmlContent
    });

    console.log('Password reset email sent successfully:', response);
    return response;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw error;
  }
};

/**
 * Send password reset confirmation email
 * @param {string} to - Recipient email address
 * @param {string} userName - User's name
 * @returns {Promise} - Resend API response
 */
const sendPasswordResetConfirmationEmail = async (to, userName) => {
  try {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset Successful</title>
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
            margin-top: 20px;
          }
          .header {
            text-align: center;
            padding-bottom: 20px;
            border-bottom: 2px solid #4CAF50;
          }
          .header h1 {
            color: #4CAF50;
            margin: 0;
          }
          .content {
            padding: 20px 0;
          }
          .footer {
            text-align: center;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            margin-top: 20px;
            color: #777;
            font-size: 12px;
          }
          .success {
            background-color: #d4edda;
            border-left: 4px solid #28a745;
            padding: 10px;
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Password Reset Successful</h1>
          </div>
          
          <div class="content">
            <p>Hi ${userName},</p>
            
            <div class="success">
              <strong>Success!</strong> Your password has been reset successfully.
            </div>
            
            <p>You can now log in to your BuddyDesk account with your new password.</p>
            
            <p>If you did not perform this action, please contact our support team immediately.</p>
            
            <p>Best regards,<br>The BuddyDesk Team</p>
          </div>
          
          <div class="footer">
            <p>This is an automated email. Please do not reply to this message.</p>
            <p>&copy; ${new Date().getFullYear()} BuddyDesk. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const response = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'BuddyDesk <onboarding@resend.dev>',
      to: to,
      subject: 'Your BuddyDesk Password Has Been Reset',
      html: htmlContent
    });

    console.log('Password reset confirmation email sent successfully:', response);
    return response;
  } catch (error) {
    console.error('Error sending password reset confirmation email:', error);
    throw error;
  }
};

module.exports = {
  sendPasswordResetEmail,
  sendPasswordResetConfirmationEmail
};

