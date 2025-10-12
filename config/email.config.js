module.exports = {
  HOST: process.env.EMAIL_HOST || 'buddydesk.in',
  PORT: process.env.EMAIL_PORT || 465,
  SECURE: process.env.EMAIL_SECURE === 'true' || true, // true for port 465, false for other ports
  USER: process.env.EMAIL_USER || 'no-reply@buddydesk.in',
  PASSWORD: process.env.EMAIL_PASSWORD,
  FROM_NAME: process.env.EMAIL_FROM_NAME || 'BuddyDesk',
  FROM_EMAIL: process.env.EMAIL_FROM_EMAIL || 'no-reply@buddydesk.in'
};

