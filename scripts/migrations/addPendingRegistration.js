const { Sequelize } = require('sequelize');
require('dotenv').config(); // Load environment variables
const dbConfig = require('../../config/db.config');

// Create database connection
const sequelize = new Sequelize(
  dbConfig.DB,
  dbConfig.USER,
  dbConfig.PASSWORD,
  {
    host: dbConfig.HOST,
    port: dbConfig.PORT || 5432,
    dialect: dbConfig.DIALECT || 'postgres',
    logging: console.log,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

async function addPendingRegistration() {
  try {
    console.log('🚀 Starting pending registration migration...');

    // Check if pending_registration table exists
    const tableExists = await sequelize.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'pending_registration'
      )
    `, { type: Sequelize.QueryTypes.SELECT });

    if (!tableExists[0].exists) {
      console.log('📝 Creating pending_registration table...');
      await sequelize.query(`
        CREATE TABLE pending_registration (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) NOT NULL UNIQUE,
          name VARCHAR(255) NOT NULL,
          password VARCHAR(255) NOT NULL,
          referred_by VARCHAR(255) NULL,
          otp VARCHAR(255) NOT NULL,
          is_verified BOOLEAN DEFAULT FALSE,
          expires_at TIMESTAMP NOT NULL,
          attempts INTEGER DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          verified_at TIMESTAMP NULL
        )
      `);

      // Add indexes
      await sequelize.query(`
        CREATE INDEX idx_pending_registration_email ON pending_registration(email)
      `);
      await sequelize.query(`
        CREATE INDEX idx_pending_registration_expires_at ON pending_registration(expires_at)
      `);
      await sequelize.query(`
        CREATE INDEX idx_pending_registration_is_verified ON pending_registration(is_verified)
      `);

      console.log('✅ pending_registration table created successfully');
    } else {
      console.log('✅ pending_registration table already exists');
    }

    // Clean up expired pending registrations (older than 24 hours)
    console.log('🧹 Cleaning up expired pending registrations...');
    const deleteResult = await sequelize.query(`
      DELETE FROM pending_registration 
      WHERE expires_at < NOW() - INTERVAL '24 hours'
    `);
    console.log(`✅ Cleaned up ${deleteResult[1]} expired pending registrations`);

    console.log('🎉 Pending registration migration completed successfully!');
    console.log('\n📊 Migration Summary:');
    console.log('- ✅ pending_registration table created with indexes');
    console.log('- ✅ Expired pending registrations cleaned up');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Run migration if called directly
if (require.main === module) {
  addPendingRegistration()
    .then(() => {
      console.log('✅ Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { addPendingRegistration };
