// Load environment variables from .env file
require('dotenv').config();

const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

// Import the database configuration
const dbConfig = require('../../config/db.config.js');

// Check if required environment variables are set
if (!dbConfig.DB || !dbConfig.USER || !dbConfig.PASSWORD || !dbConfig.HOST) {
  console.error('❌ Missing required database environment variables:');
  console.error('   DB_NAME, DB_USER, DB_PASSWORD, DB_HOST');
  process.exit(1);
}

// Create Sequelize instance
const sequelize = new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, {
  host: dbConfig.HOST,
  dialect: dbConfig.DIALECT || 'postgres',
  port: dbConfig.PORT || 5432,
  logging: console.log, // Show SQL queries
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 60000,
    idle: 10000
  },
  retry: {
    max: 3
  }
});

async function updateTokenBlacklistColumn() {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');

    // Check if token_blacklist table exists
    const [results] = await sequelize.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'token_blacklist'
      );
    `);

    if (!results[0].exists) {
      console.log('⚠️  token_blacklist table does not exist. Migration not needed.');
      return;
    }

    // Check current column type
    const [columnInfo] = await sequelize.query(`
      SELECT column_name, data_type, character_maximum_length 
      FROM information_schema.columns 
      WHERE table_name = 'token_blacklist' 
      AND column_name = 'token';
    `);

    if (columnInfo.length === 0) {
      console.log('⚠️  token column not found in token_blacklist table.');
      return;
    }

    const currentType = columnInfo[0];
    console.log('📊 Current token column info:', currentType);

    // Check if already TEXT type
    if (currentType.data_type === 'text' || currentType.character_maximum_length === null) {
      console.log('✅ Token column is already TEXT type. No migration needed.');
      return;
    }

    console.log('🔄 Updating token column from VARCHAR to TEXT...');

    // Update the column type
    await sequelize.query(`
      ALTER TABLE token_blacklist 
      ALTER COLUMN token TYPE TEXT;
    `);

    console.log('✅ Token column updated successfully to TEXT type.');

    // Verify the change
    const [updatedInfo] = await sequelize.query(`
      SELECT column_name, data_type, character_maximum_length 
      FROM information_schema.columns 
      WHERE table_name = 'token_blacklist' 
      AND column_name = 'token';
    `);

    console.log('📊 Updated token column info:', updatedInfo[0]);

    // Add comment
    await sequelize.query(`
      COMMENT ON COLUMN token_blacklist.token IS 'JWT token (can be longer than 255 characters)';
    `);

    console.log('✅ Added comment to token column.');

    console.log('\n🎉 Migration completed successfully!');
    console.log('📝 The token_blacklist.token column can now store JWT tokens of any length.');

  } catch (error) {
    console.error('❌ Error updating token blacklist column:', error);
    throw error;
  } finally {
    // Close database connection
    await sequelize.close();
    console.log('🔌 Database connection closed.');
  }
}

// Main execution
if (require.main === module) {
  console.log('🚀 Starting token blacklist column migration...');
  updateTokenBlacklistColumn()
    .then(() => {
      console.log('✅ Migration completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    });
}

module.exports = {
  updateTokenBlacklistColumn
};
