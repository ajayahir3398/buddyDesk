const db = require('../models');
const logger = require('../utils/logger');

async function addFileCategoryColumn() {
  try {
    console.log('🔄 Starting database migration: Adding file_category column...');
    
    // Check if the column already exists
    const tableInfo = await db.sequelize.query(
      "SELECT column_name FROM information_schema.columns WHERE table_name = 'post_attachments' AND column_name = 'file_category'",
      { type: db.sequelize.QueryTypes.SELECT }
    );

    if (tableInfo.length > 0) {
      console.log('✅ file_category column already exists. Skipping migration.');
      return;
    }

    // Add the new column
    await db.sequelize.query(`
      ALTER TABLE post_attachments 
      ADD COLUMN file_category ENUM('images', 'audio', 'documents', 'posts') DEFAULT 'posts'
    `);

    console.log('✅ Successfully added file_category column to post_attachments table');

    // Update existing records to set file_category based on current file_path
    console.log('🔄 Updating existing records with file categories...');
    
    const updateResult = await db.sequelize.query(`
      UPDATE post_attachments 
      SET file_category = CASE 
        WHEN file_path LIKE 'images/%' THEN 'images'
        WHEN file_path LIKE 'audio/%' THEN 'audio'
        WHEN file_path LIKE 'documents/%' THEN 'documents'
        ELSE 'posts'
      END
      WHERE file_category IS NULL OR file_category = 'posts'
    `);

    console.log(`✅ Updated ${updateResult[1]} existing records with file categories`);

    // Verify the migration
    const countResult = await db.sequelize.query(
      "SELECT COUNT(*) as total FROM post_attachments",
      { type: db.sequelize.QueryTypes.SELECT }
    );

    const categoryCounts = await db.sequelize.query(`
      SELECT file_category, COUNT(*) as count 
      FROM post_attachments 
      GROUP BY file_category
    `, { type: db.sequelize.QueryTypes.SELECT });

    console.log(`\n📊 Migration Summary:`);
    console.log(`Total attachments: ${countResult[0].total}`);
    categoryCounts.forEach(cat => {
      console.log(`${cat.file_category}: ${cat.count}`);
    });

    console.log('\n🎉 Database migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    logger.error('Database migration failed', { error: error.message, stack: error.stack });
    throw error;
  } finally {
    await db.sequelize.close();
  }
}

// Run the migration if this script is executed directly
if (require.main === module) {
  addFileCategoryColumn()
    .then(() => {
      console.log('✅ Migration script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration script failed:', error.message);
      process.exit(1);
    });
}

module.exports = { addFileCategoryColumn };
