module.exports = {
  HOST: process.env.EMAIL_HOST,
  PORT: process.env.EMAIL_PORT, // Changed from 465 to 587
  SECURE: process.env.EMAIL_SECURE === 'true', // Changed to false for STARTTLS
  USER: process.env.EMAIL_USER,
  PASSWORD: process.env.EMAIL_PASSWORD,
  FROM_NAME: process.env.EMAIL_FROM_NAME,
  FROM_EMAIL: process.env.EMAIL_FROM_EMAIL
};

