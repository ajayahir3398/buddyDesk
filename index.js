require('dotenv').config();

// Validate environment variables before starting the application
const validateEnvironment = require('./utils/validateEnv');

try {
  validateEnvironment();
} catch (error) {
  console.error('❌ Environment validation failed:', error.message);
  process.exit(1);
}

const app = require("./app");

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`✅ Server running on port ${PORT}`);
  }
});
