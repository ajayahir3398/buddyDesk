/**
 * Migration Script: Add Referral Codes to Existing Users
 * 
 * Description:
 * This script generates and assigns unique referral codes to all users
 * who don't have one yet. This is needed because the referral system
 * was added after some users had already registered.
 * 
 * Usage:
 *   node scripts/migrations/addReferralCodesToExistingUsers.js
 * 
 * Features:
 * - Generates unique 6-character alphanumeric codes
 * - Only updates users without referral codes
 * - Ensures no duplicate codes are generated
 * - Safe to run multiple times (idempotent)
 * - Provides detailed logging
 */

// Load environment variables
require('dotenv').config();

const db = require('../../models');
const User = db.User;

/**
 * Generate a random 6-character alphanumeric referral code
 */
function generateReferralCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

/**
 * Check if a referral code already exists in the database
 */
async function isCodeUnique(code, existingCodes) {
  return !existingCodes.has(code);
}

/**
 * Generate a unique referral code
 */
async function generateUniqueReferralCode(existingCodes) {
  let code;
  let attempts = 0;
  const maxAttempts = 100;

  do {
    code = generateReferralCode();
    attempts++;
    
    if (attempts >= maxAttempts) {
      throw new Error('Unable to generate unique referral code after maximum attempts');
    }
  } while (!await isCodeUnique(code, existingCodes));

  // Add to existing codes set to prevent duplicates in this batch
  existingCodes.add(code);
  
  return code;
}

/**
 * Main migration function
 */
async function addReferralCodesToExistingUsers() {
  console.log('🚀 Starting migration: Add referral codes to existing users');
  console.log('=' .repeat(60));

  try {
    // Step 1: Find all users without referral codes
    console.log('\n📊 Step 1: Checking for users without referral codes...');
    
    const usersWithoutCodes = await User.findAll({
      where: {
        referral_code: null
      },
      attributes: ['id', 'name', 'email', 'referral_code']
    });

    if (usersWithoutCodes.length === 0) {
      console.log('✅ All users already have referral codes!');
      console.log('   No migration needed.');
      return;
    }

    console.log(`📝 Found ${usersWithoutCodes.length} users without referral codes`);

    // Step 2: Get all existing referral codes to avoid duplicates
    console.log('\n📊 Step 2: Loading existing referral codes...');
    
    const usersWithCodes = await User.findAll({
      where: {
        referral_code: {
          [db.Sequelize.Op.ne]: null
        }
      },
      attributes: ['referral_code']
    });

    const existingCodes = new Set(usersWithCodes.map(u => u.referral_code));
    console.log(`   Found ${existingCodes.size} existing referral codes`);

    // Step 3: Generate unique codes for each user
    console.log('\n📊 Step 3: Generating unique referral codes...');
    
    const updates = [];
    let successCount = 0;
    let errorCount = 0;

    for (const user of usersWithoutCodes) {
      try {
        const referralCode = await generateUniqueReferralCode(existingCodes);
        
        updates.push({
          id: user.id,
          name: user.name,
          email: user.email,
          referralCode: referralCode
        });

        successCount++;
        
        // Log progress every 10 users
        if (successCount % 10 === 0) {
          console.log(`   Progress: ${successCount}/${usersWithoutCodes.length} codes generated`);
        }
      } catch (error) {
        console.error(`   ❌ Error generating code for user ${user.id}:`, error.message);
        errorCount++;
      }
    }

    console.log(`\n✅ Generated ${successCount} unique referral codes`);
    if (errorCount > 0) {
      console.log(`⚠️  Failed to generate ${errorCount} codes`);
    }

    // Step 4: Update users in database
    console.log('\n📊 Step 4: Updating users in database...');
    
    let updateSuccessCount = 0;
    let updateErrorCount = 0;

    // Use transaction for safety
    await db.sequelize.transaction(async (transaction) => {
      for (const update of updates) {
        try {
          await User.update(
            { 
              referral_code: update.referralCode,
              updated_at: new Date()
            },
            { 
              where: { id: update.id },
              transaction
            }
          );

          updateSuccessCount++;
          
          // Log progress every 10 users
          if (updateSuccessCount % 10 === 0) {
            console.log(`   Progress: ${updateSuccessCount}/${updates.length} users updated`);
          }
        } catch (error) {
          console.error(`   ❌ Error updating user ${update.id}:`, error.message);
          updateErrorCount++;
          throw error; // Rollback transaction on error
        }
      }
    });

    // Step 5: Summary
    console.log('\n' + '='.repeat(60));
    console.log('✅ Migration completed successfully!');
    console.log('='.repeat(60));
    console.log(`📊 Summary:`);
    console.log(`   - Users processed: ${usersWithoutCodes.length}`);
    console.log(`   - Codes generated: ${successCount}`);
    console.log(`   - Users updated: ${updateSuccessCount}`);
    console.log(`   - Errors: ${updateErrorCount}`);
    console.log('='.repeat(60));

    // Step 6: Verification
    console.log('\n📊 Step 5: Verification...');
    
    const remainingWithoutCodes = await User.count({
      where: {
        referral_code: null
      }
    });

    if (remainingWithoutCodes === 0) {
      console.log('✅ Verification successful: All users now have referral codes!');
    } else {
      console.log(`⚠️  Warning: ${remainingWithoutCodes} users still without referral codes`);
    }

    // Display sample of updated users
    console.log('\n📝 Sample of updated users:');
    const sampleUsers = updates.slice(0, 5);
    sampleUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.email} -> ${user.referralCode}`);
    });
    if (updates.length > 5) {
      console.log(`   ... and ${updates.length - 5} more`);
    }

  } catch (error) {
    console.error('\n❌ Migration failed!');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

/**
 * Run the migration
 */
async function run() {
  try {
    // Test database connection first
    console.log('🔌 Testing database connection...');
    await db.sequelize.authenticate();
    console.log('✅ Database connection successful\n');

    // Run the migration
    await addReferralCodesToExistingUsers();
    
    console.log('\n✅ Migration script completed successfully');
    
    // Close database connection
    await db.sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration script failed:', error.message);
    
    if (error.name === 'SequelizeConnectionRefusedError') {
      console.error('\n💡 Database Connection Tips:');
      console.error('   1. Make sure PostgreSQL is running');
      console.error('   2. Check your .env file has correct database credentials:');
      console.error('      - DB_HOST');
      console.error('      - DB_USER');
      console.error('      - DB_PASSWORD');
      console.error('      - DB_NAME');
      console.error('      - DB_PORT');
      console.error('   3. Verify PostgreSQL is running:');
      console.error('      Windows: Check Services or "pg_ctl status"');
      console.error('      Linux/Mac: "sudo systemctl status postgresql"');
      console.error('   4. Test connection manually:');
      console.error('      psql -h localhost -U your_user -d your_database');
    }
    
    // Close database connection if it was opened
    try {
      await db.sequelize.close();
    } catch (closeError) {
      // Ignore close errors
    }
    
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  run();
}

module.exports = { addReferralCodesToExistingUsers };

