// Load environment variables from .env file
require('dotenv').config();

const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

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

// Import the Skill model
const Skill = require('../models/skill.model.js')(sequelize, DataTypes);

// Skill data to insert
const skillsData = [
  {
    name: "Academic Help",
    description: "Educational support, tutoring, and academic assistance"
  },
  {
    name: "Art & Creativity",
    description: "Creative arts, crafts, and artistic skills"
  },
  {
    name: "Cooking & Food",
    description: "Culinary skills, cooking classes, and food preparation"
  },
  {
    name: "Creative Skills",
    description: "Creative abilities, design, and artistic talents"
  },
  {
    name: "Education & Tutoring",
    description: "Teaching, mentoring, and educational services"
  },
  {
    name: "Event & Fest Skills",
    description: "Event planning, festival organization, and celebration skills"
  },
  {
    name: "Fashion & Grooming",
    description: "Fashion advice, styling, and personal grooming"
  },
  {
    name: "Fitness & Sports",
    description: "Physical fitness, sports training, and athletic activities"
  },
  {
    name: "Freelancing & Side Hustles",
    description: "Freelance work, side projects, and entrepreneurial skills"
  },
  {
    name: "Fun & Personal",
    description: "Entertainment, hobbies, and personal interests"
  },
  {
    name: "Language & Communication",
    description: "Language learning, communication skills, and translation"
  },
  {
    name: "Lifestyle & Well-being",
    description: "Health, wellness, and lifestyle improvement"
  },
  {
    name: "Music & Dance",
    description: "Musical instruments, dance classes, and performance arts"
  },
  {
    name: "Parenting & Home",
    description: "Parenting advice, home management, and family skills"
  },
  {
    name: "Personality & Communication",
    description: "Personal development, communication, and social skills"
  },
  {
    name: "Repairs & Fixes",
    description: "Handyman services, repairs, and maintenance"
  },
  {
    name: "Tech & Digital Skills",
    description: "Technology, digital tools, and computer skills"
  },
  {
    name: "Travel & Local Help",
    description: "Travel guidance, local knowledge, and tourism assistance"
  }
];

async function insertSkills() {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');

    // Sync the model (this will create the table if it doesn't exist)
    await sequelize.sync({ force: false });
    console.log('✅ Database synchronized.');

    // Check if skills already exist
    const existingSkills = await Skill.findAll();
    if (existingSkills.length > 0) {
      console.log(`⚠️  Found ${existingSkills.length} existing skills in the database.`);
      console.log('Do you want to continue and insert new skills? (This may create duplicates)');
      console.log('To avoid duplicates, consider clearing the table first or using upsert.');
      return;
    }

    // Insert all skills
    const insertedSkills = await Skill.bulkCreate(skillsData);
    console.log(`✅ Successfully inserted ${insertedSkills.length} skills:`);
    
    insertedSkills.forEach(skill => {
      console.log(`  - ${skill.name}: ${skill.description}`);
    });

    console.log('\n🎉 Skills insertion completed successfully!');

  } catch (error) {
    console.error('❌ Error inserting skills:', error);
  } finally {
    // Close database connection
    await sequelize.close();
    console.log('🔌 Database connection closed.');
  }
}

// Alternative function to upsert skills (insert or update)
async function upsertSkills() {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');

    // Sync the model
    await sequelize.sync({ force: false });
    console.log('✅ Database synchronized.');

    // Upsert skills (insert if not exists, update if exists)
    console.log('🔄 Upserting skills...');
    
    for (const skillData of skillsData) {
      const [skill, created] = await Skill.findOrCreate({
        where: { name: skillData.name },
        defaults: skillData
      });
      
      if (created) {
        console.log(`✅ Created: ${skill.name}`);
      } else {
        // Update description if skill exists
        await skill.update({ description: skillData.description });
        console.log(`🔄 Updated: ${skill.name}`);
      }
    }

    console.log('\n🎉 Skills upsert completed successfully!');

  } catch (error) {
    console.error('❌ Error upserting skills:', error);
  } finally {
    // Close database connection
    await sequelize.close();
    console.log('🔌 Database connection closed.');
  }
}

// Main execution
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--upsert')) {
    console.log('🚀 Starting skills upsert...');
    upsertSkills();
  } else {
    console.log('🚀 Starting skills insertion...');
    insertSkills();
  }
}

module.exports = {
  insertSkills,
  upsertSkills,
  skillsData
};
