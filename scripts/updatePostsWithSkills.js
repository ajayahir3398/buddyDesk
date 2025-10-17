// Load environment variables from .env file
require('dotenv').config();

const { Sequelize, DataTypes } = require('sequelize');

// Import the database configuration
const dbConfig = require('../config/db.config.js');

// Check if required environment variables are set
if (!dbConfig.DB || !dbConfig.USER || !dbConfig.PASSWORD || !dbConfig.HOST) {
  console.error('❌ Missing required database environment variables:');
  console.error('   DB_NAME, DB_USER, DB_PASSWORD, DB_HOST');
  console.error('');
  console.error('Please set these environment variables or create a .env file with:');
  console.error('DB_HOST=your_host');
  console.error('DB_USER=your_username');
  console.error('DB_PASSWORD=your_password');
  console.error('DB_NAME=your_database_name');
  console.error('DB_PORT=5432 (optional, defaults to 5432)');
  process.exit(1);
}

// Create Sequelize instance with the same configuration as models/index.js
const sequelize = new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, {
  host: dbConfig.HOST,
  dialect: dbConfig.DIALECT || 'postgres',
  port: dbConfig.PORT || 5432,
  logging: false, // Set to console.log to see SQL queries
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

// Import the models
const Post = require('../models/post.model.js')(sequelize, DataTypes);
const Skill = require('../models/skill.model.js')(sequelize, DataTypes);
const SubSkill = require('../models/subSkill.model.js')(sequelize, DataTypes);

// Note: We don't need to set up associations for this migration script
// as we're only doing basic CRUD operations

// Default values to assign
const DEFAULT_SKILL_ID = 1; // "Academic Help"
const DEFAULT_SUB_SKILL_ID = 1; // "Assignment Proofreading" (first sub-skill under Academic Help)

async function updatePostsWithSkills() {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');

    // Sync the models
    await sequelize.sync({ force: false });
    console.log('✅ Database synchronized.');

    // Check if default skill and sub-skill exist
    const defaultSkill = await Skill.findByPk(DEFAULT_SKILL_ID);
    const defaultSubSkill = await SubSkill.findByPk(DEFAULT_SUB_SKILL_ID);

    if (!defaultSkill) {
      console.error(`❌ Default skill with ID ${DEFAULT_SKILL_ID} not found.`);
      return;
    }

    if (!defaultSubSkill) {
      console.error(`❌ Default sub-skill with ID ${DEFAULT_SUB_SKILL_ID} not found.`);
      return;
    }

    console.log(`✅ Using default skill: "${defaultSkill.name}" (ID: ${DEFAULT_SKILL_ID})`);
    console.log(`✅ Using default sub-skill: "${defaultSubSkill.name}" (ID: ${DEFAULT_SUB_SKILL_ID})`);

    // Find posts where required_skill_id is null
    const postsWithNullSkill = await Post.findAll({
      where: {
        required_skill_id: null
      },
      attributes: ['id', 'title', 'required_skill_id', 'required_sub_skill_id']
    });

    console.log(`\n📊 Found ${postsWithNullSkill.length} posts with null required_skill_id`);

    // Find posts where required_sub_skill_id is null
    const postsWithNullSubSkill = await Post.findAll({
      where: {
        required_sub_skill_id: null
      },
      attributes: ['id', 'title', 'required_skill_id', 'required_sub_skill_id']
    });

    console.log(`📊 Found ${postsWithNullSubSkill.length} posts with null required_sub_skill_id`);

    // Find posts where both are null
    const postsWithBothNull = await Post.findAll({
      where: {
        required_skill_id: null,
        required_sub_skill_id: null
      },
      attributes: ['id', 'title', 'required_skill_id', 'required_sub_skill_id']
    });

    console.log(`📊 Found ${postsWithBothNull.length} posts with both fields null`);

    if (postsWithNullSkill.length === 0 && postsWithNullSubSkill.length === 0) {
      console.log('\n🎉 No posts need updating! All posts already have skill and sub-skill IDs assigned.');
      return;
    }

    // Update posts with null required_skill_id
    let updatedSkillCount = 0;
    if (postsWithNullSkill.length > 0) {
      console.log('\n🔄 Updating posts with null required_skill_id...');
      
      const result = await Post.update(
        { required_skill_id: DEFAULT_SKILL_ID },
        {
          where: {
            required_skill_id: null
          }
        }
      );
      
      updatedSkillCount = result[0]; // Sequelize returns [affectedCount, affectedRows]
      console.log(`✅ Updated ${updatedSkillCount} posts with default skill ID ${DEFAULT_SKILL_ID}`);
    }

    // Update posts with null required_sub_skill_id
    let updatedSubSkillCount = 0;
    if (postsWithNullSubSkill.length > 0) {
      console.log('\n🔄 Updating posts with null required_sub_skill_id...');
      
      const result = await Post.update(
        { required_sub_skill_id: DEFAULT_SUB_SKILL_ID },
        {
          where: {
            required_sub_skill_id: null
          }
        }
      );
      
      updatedSubSkillCount = result[0]; // Sequelize returns [affectedCount, affectedRows]
      console.log(`✅ Updated ${updatedSubSkillCount} posts with default sub-skill ID ${DEFAULT_SUB_SKILL_ID}`);
    }

    // Verify the updates
    console.log('\n🔍 Verifying updates...');
    
    const remainingNullSkill = await Post.count({
      where: { required_skill_id: null }
    });
    
    const remainingNullSubSkill = await Post.count({
      where: { required_sub_skill_id: null }
    });

    console.log(`📊 Posts still with null required_skill_id: ${remainingNullSkill}`);
    console.log(`📊 Posts still with null required_sub_skill_id: ${remainingNullSubSkill}`);

    // Show summary
    console.log('\n📈 Update Summary:');
    console.log(`   - Posts updated with skill ID: ${updatedSkillCount}`);
    console.log(`   - Posts updated with sub-skill ID: ${updatedSubSkillCount}`);
    console.log(`   - Total posts processed: ${Math.max(updatedSkillCount, updatedSubSkillCount)}`);
    
    if (remainingNullSkill === 0 && remainingNullSubSkill === 0) {
      console.log('\n🎉 All posts now have skill and sub-skill IDs assigned!');
    } else {
      console.log('\n⚠️  Some posts still have null values. Please check manually.');
    }

  } catch (error) {
    console.error('❌ Error updating posts with skills:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    // Close database connection
    await sequelize.close();
    console.log('\n🔌 Database connection closed.');
  }
}

// Function to show current statistics
async function showPostStatistics() {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ force: false });

    const totalPosts = await Post.count();
    const postsWithSkill = await Post.count({ where: { required_skill_id: { [sequelize.Sequelize.Op.ne]: null } } });
    const postsWithSubSkill = await Post.count({ where: { required_sub_skill_id: { [sequelize.Sequelize.Op.ne]: null } } });
    const postsWithBoth = await Post.count({ 
      where: { 
        required_skill_id: { [sequelize.Sequelize.Op.ne]: null },
        required_sub_skill_id: { [sequelize.Sequelize.Op.ne]: null }
      } 
    });

    console.log('\n📊 Current Post Statistics:');
    console.log(`   Total posts: ${totalPosts}`);
    console.log(`   Posts with skill ID: ${postsWithSkill} (${Math.round(postsWithSkill/totalPosts*100)}%)`);
    console.log(`   Posts with sub-skill ID: ${postsWithSubSkill} (${Math.round(postsWithSubSkill/totalPosts*100)}%)`);
    console.log(`   Posts with both: ${postsWithBoth} (${Math.round(postsWithBoth/totalPosts*100)}%)`);

  } catch (error) {
    console.error('❌ Error getting statistics:', error);
  } finally {
    await sequelize.close();
  }
}

// Function to update with custom values
async function updatePostsWithCustomSkills(skillId, subSkillId) {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ force: false });

    // Validate the provided IDs
    const skill = await Skill.findByPk(skillId);
    const subSkill = await SubSkill.findByPk(subSkillId);

    if (!skill) {
      console.error(`❌ Skill with ID ${skillId} not found.`);
      return;
    }

    if (!subSkill) {
      console.error(`❌ Sub-skill with ID ${subSkillId} not found.`);
      return;
    }

    console.log(`✅ Using custom skill: "${skill.name}" (ID: ${skillId})`);
    console.log(`✅ Using custom sub-skill: "${subSkill.name}" (ID: ${subSkillId})`);

    // Update posts with null required_skill_id
    const skillResult = await Post.update(
      { required_skill_id: skillId },
      { where: { required_skill_id: null } }
    );

    // Update posts with null required_sub_skill_id
    const subSkillResult = await Post.update(
      { required_sub_skill_id: subSkillId },
      { where: { required_sub_skill_id: null } }
    );

    console.log(`✅ Updated ${skillResult[0]} posts with skill ID ${skillId}`);
    console.log(`✅ Updated ${subSkillResult[0]} posts with sub-skill ID ${subSkillId}`);

  } catch (error) {
    console.error('❌ Error updating posts with custom skills:', error);
  } finally {
    await sequelize.close();
  }
}

// Main execution
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--stats') || args.includes('-s')) {
    console.log('📊 Showing post statistics...');
    showPostStatistics();
  } else if (args.includes('--custom') || args.includes('-c')) {
    const skillId = parseInt(args[args.indexOf('--custom') + 1] || args[args.indexOf('-c') + 1]);
    const subSkillId = parseInt(args[args.indexOf('--custom') + 2] || args[args.indexOf('-c') + 2]);
    
    if (!skillId || !subSkillId) {
      console.error('❌ Please provide both skill ID and sub-skill ID for custom update.');
      console.error('Usage: node updatePostsWithSkills.js --custom <skillId> <subSkillId>');
      process.exit(1);
    }
    
    console.log(`🚀 Starting custom update with skill ID ${skillId} and sub-skill ID ${subSkillId}...`);
    updatePostsWithCustomSkills(skillId, subSkillId);
  } else {
    console.log('🚀 Starting posts update with default skills...');
    updatePostsWithSkills();
  }
}

module.exports = {
  updatePostsWithSkills,
  showPostStatistics,
  updatePostsWithCustomSkills
};
