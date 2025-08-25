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

// Import the models
const Skill = require('../models/skill.model.js')(sequelize, DataTypes);
const SubSkill = require('../models/subSkill.model.js')(sequelize, DataTypes);

// Sub-skill data to insert
const subSkillsData = [
  // Skill ID 1 - Academic Help
  { skill_id: 1, name: "Assignment Proofreading", description: "Reviewing and improving academic assignments" },
  { skill_id: 1, name: "College Project Guidance", description: "Help with college projects and research work" },
  { skill_id: 1, name: "Exam Notes Sharing", description: "Sharing study materials and exam preparation notes" },
  { skill_id: 1, name: "Research Paper Help", description: "Assistance with research papers and academic writing" },
  { skill_id: 1, name: "Subject Tutoring (Math, Physics, etc.)", description: "One-on-one tutoring for various academic subjects" },
  
  // Skill ID 2 - Art & Creativity
  { skill_id: 2, name: "Animation", description: "2D and 3D animation techniques" },
  { skill_id: 2, name: "Drawing & Sketching", description: "Basic to advanced drawing and sketching techniques" },
  { skill_id: 2, name: "Graphic Design", description: "Digital design and visual communication" },
  { skill_id: 2, name: "Painting", description: "Various painting styles and techniques" },
  { skill_id: 2, name: "Photography", description: "Photography skills and camera techniques" },
  { skill_id: 2, name: "Video Editing", description: "Video editing and post-production skills" },
  
  // Skill ID 3 - Cooking & Food
  { skill_id: 3, name: "Baking", description: "Baking and pastry making skills" },
  { skill_id: 3, name: "Cooking Lessons", description: "Basic to advanced cooking techniques" },
  { skill_id: 3, name: "Meal Planning", description: "Planning balanced and budget-friendly meals" },
  { skill_id: 3, name: "Nutrition Advice", description: "Healthy eating and nutrition guidance" },
  { skill_id: 3, name: "Regional Cuisine (Gujarati, South Indian, etc.)", description: "Traditional regional cooking styles" },
  
  // Skill ID 4 - Creative Skills
  { skill_id: 4, name: "Instagram Reels Editing", description: "Social media content creation and editing" },
  { skill_id: 4, name: "Logo Making", description: "Logo design and branding services" },
  { skill_id: 4, name: "Meme Making / Creative Writing", description: "Creative content creation and writing" },
  { skill_id: 4, name: "Photography (for college events)", description: "Event photography and documentation" },
  { skill_id: 4, name: "Poster/Flyer Design (for college fests)", description: "Design services for college events and promotions" },
  
  // Skill ID 5 - Education & Tutoring
  { skill_id: 5, name: "English", description: "English language and literature tutoring" },
  { skill_id: 5, name: "Exam Preparation (UPSC, NEET, SSC, etc.)", description: "Preparation for competitive exams" },
  { skill_id: 5, name: "Maths", description: "Mathematics tutoring and problem solving" },
  { skill_id: 5, name: "Science", description: "Science subjects tutoring and experiments" },
  { skill_id: 5, name: "Spoken Languages (Hindi, Gujarati, English, etc.)", description: "Conversational language learning" },
  
  // Skill ID 6 - Event & Fest Skills
  { skill_id: 6, name: "Anchoring Tips", description: "Event anchoring and hosting skills" },
  { skill_id: 6, name: "Decoration Crafts", description: "Event decoration and craft making" },
  { skill_id: 6, name: "Event Management", description: "Event planning and management services" },
  { skill_id: 6, name: "Hosting Icebreakers & Games", description: "Event games and icebreaker activities" },
  { skill_id: 6, name: "Sponsorship Pitch Deck Help", description: "Creating sponsorship proposals and pitch decks" },
  
  // Skill ID 7 - Fashion & Grooming
  { skill_id: 7, name: "Hair Styling", description: "Hair styling and grooming techniques" },
  { skill_id: 7, name: "Makeup", description: "Makeup application and beauty techniques" },
  { skill_id: 7, name: "Mehendi Art", description: "Traditional mehendi and henna art" },
  { skill_id: 7, name: "Personal Styling", description: "Personal fashion and style consultation" },
  { skill_id: 7, name: "Skin Care Tips", description: "Skincare routines and beauty advice" },
  
  // Skill ID 8 - Fitness & Sports
  { skill_id: 8, name: "Diet Plans on a Budget", description: "Affordable diet and nutrition plans" },
  { skill_id: 8, name: "Home Workout Guidance", description: "Home-based fitness routines and guidance" },
  { skill_id: 8, name: "Martial Arts", description: "Martial arts training and self-defense" },
  { skill_id: 8, name: "Running Partner / Routine Builder", description: "Running partner and routine development" },
  { skill_id: 8, name: "Sports Coaching (Cricket, Badminton, etc.)", description: "Coaching for various sports activities" },
  { skill_id: 8, name: "Yoga Partner", description: "Yoga practice partner and guidance" },
  { skill_id: 8, name: "Zumba/Group Exercise Coach", description: "Group fitness and dance exercise coaching" },
  
  // Skill ID 9 - Freelancing & Side Hustles
  { skill_id: 9, name: "Cryptocurrency Basics", description: "Cryptocurrency education and investment basics" },
  { skill_id: 9, name: "Freelance Profile Setup (Fiverr, Upwork)", description: "Setting up freelance profiles and portfolios" },
  { skill_id: 9, name: "Instagram Page Growth Tips", description: "Social media growth and marketing strategies" },
  { skill_id: 9, name: "Money-Saving Apps Advice", description: "Financial apps and money-saving tips" },
  { skill_id: 9, name: "YouTube Setup Help", description: "YouTube channel setup and content creation" },
  
  // Skill ID 10 - Fun & Personal
  { skill_id: 10, name: "Gaming Partner (BGMI, FIFA, Valorant)", description: "Gaming partner for various video games" },
  { skill_id: 10, name: "Movie Night Planner", description: "Planning and organizing movie nights" },
  { skill_id: 10, name: "Netflix Recommendations", description: "Movie and TV show recommendations" },
  { skill_id: 10, name: "Relationship Advice", description: "Personal relationship guidance and advice" },
  { skill_id: 10, name: "Tarot / Astrology", description: "Tarot reading and astrological guidance" },
  
  // Skill ID 11 - Language & Communication
  { skill_id: 11, name: "Content Writing", description: "Content creation and writing skills" },
  { skill_id: 11, name: "Job Interview Practice", description: "Interview preparation and mock interviews" },
  { skill_id: 11, name: "Presentation Skills", description: "Professional presentation and communication skills" },
  { skill_id: 11, name: "Public Speaking", description: "Public speaking and presentation skills" },
  { skill_id: 11, name: "Resume Building", description: "Resume writing and career document preparation" },
  
  // Skill ID 12 - Lifestyle & Well-being
  { skill_id: 12, name: "Goal Planning", description: "Personal goal setting and achievement strategies" },
  { skill_id: 12, name: "Habit Building", description: "Building positive habits and routines" },
  { skill_id: 12, name: "Life Coaching", description: "Personal development and life guidance" },
  { skill_id: 12, name: "Meditation", description: "Meditation and mindfulness practices" },
  { skill_id: 12, name: "Stress Management", description: "Stress relief and mental wellness techniques" },
  
  // Skill ID 13 - Music & Dance
  { skill_id: 13, name: "Beatboxing / Rap Writing", description: "Beatboxing and rap writing skills" },
  { skill_id: 13, name: "Classical Dance", description: "Traditional classical dance forms" },
  { skill_id: 13, name: "DJing / Music Mixing", description: "DJ skills and music mixing techniques" },
  { skill_id: 13, name: "Guitar", description: "Guitar lessons and playing techniques" },
  { skill_id: 13, name: "Keyboard/Piano", description: "Piano and keyboard lessons" },
  { skill_id: 13, name: "Modern Dance", description: "Contemporary and modern dance styles" },
  { skill_id: 13, name: "Singing", description: "Vocal training and singing techniques" },
  
  // Skill ID 14 - Parenting & Home
  { skill_id: 14, name: "Baby Sitting", description: "Childcare and babysitting services" },
  { skill_id: 14, name: "Home Organization", description: "Home organization and decluttering tips" },
  { skill_id: 14, name: "Kids Homework Help", description: "Assistance with children's homework and studies" },
  { skill_id: 14, name: "Storytelling", description: "Storytelling and creative writing for children" },
  { skill_id: 14, name: "Toy Repair", description: "Repairing and maintaining children's toys" },
  
  // Skill ID 15 - Personality & Communication
  { skill_id: 15, name: "Debating", description: "Debate skills and argumentation techniques" },
  { skill_id: 15, name: "English Speaking Buddy", description: "English conversation practice partner" },
  { skill_id: 15, name: "Interview Preparation", description: "Interview skills and preparation guidance" },
  { skill_id: 15, name: "Public Speaking Practice", description: "Public speaking practice and improvement" },
  { skill_id: 15, name: "Stage Hosting Tips", description: "Event hosting and stage presence skills" },
  
  // Skill ID 16 - Repairs & Fixes
  { skill_id: 16, name: "Bicycle Repair", description: "Bicycle maintenance and repair services" },
  { skill_id: 16, name: "Electrician Help", description: "Electrical work and wiring assistance" },
  { skill_id: 16, name: "Home Appliance Fixing", description: "Repair and maintenance of household appliances" },
  { skill_id: 16, name: "Mobile/Computer Repair", description: "Repair services for mobile phones and computers" },
  { skill_id: 16, name: "Plumbing Help", description: "Plumbing repairs and installations" },
  
  // Skill ID 17 - Tech & Digital Skills
  { skill_id: 17, name: "App Development", description: "Mobile app development and programming" },
  { skill_id: 17, name: "Excel/Google Sheets", description: "Spreadsheet and data management skills" },
  { skill_id: 17, name: "Social Media Management", description: "Social media strategy and content management" },
  { skill_id: 17, name: "UI/UX Design", description: "User interface and user experience design" },
  { skill_id: 17, name: "Video Editing", description: "Digital video editing and post-production" },
  { skill_id: 17, name: "Web Design", description: "Website design and development" },
  
  // Skill ID 18 - Travel & Local Help
  { skill_id: 18, name: "Bike/Car Knowledge", description: "Vehicle maintenance and driving tips" },
  { skill_id: 18, name: "Cheap Travel Hacks", description: "Budget travel tips and money-saving advice" },
  { skill_id: 18, name: "Hostel Cooking", description: "Cooking tips for hostel and shared living spaces" },
  { skill_id: 18, name: "Itinerary Suggestions", description: "Travel itinerary recommendations and planning" },
  { skill_id: 18, name: "Local Guide", description: "Local area knowledge and guidance" },
  { skill_id: 18, name: "Public Transport Help", description: "Public transportation guidance and tips" },
  { skill_id: 18, name: "Room Setup Help", description: "Room decoration and setup assistance" },
  { skill_id: 18, name: "Second-hand Books Exchange", description: "Book exchange and sharing services" },
  { skill_id: 18, name: "Travel Planning", description: "Travel itinerary and trip planning assistance" }
];

async function insertSubSkills() {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');

    // Sync the models (this will create the tables if they don't exist)
    await sequelize.sync({ force: false });
    console.log('✅ Database synchronized.');

    // Check if skills exist first
    const existingSkills = await Skill.findAll();
    if (existingSkills.length === 0) {
      console.error('❌ No skills found in the database. Please run the skills insertion script first.');
      console.error('Run: npm run insert-skills');
      return;
    }
    console.log(`✅ Found ${existingSkills.length} skills in the database.`);

    // Check if sub-skills already exist
    const existingSubSkills = await SubSkill.findAll();
    if (existingSubSkills.length > 0) {
      console.log(`⚠️  Found ${existingSubSkills.length} existing sub-skills in the database.`);
      console.log('Do you want to continue and insert new sub-skills? (This may create duplicates)');
      console.log('To avoid duplicates, consider clearing the table first or using upsert.');
      return;
    }

    // Insert all sub-skills
    const insertedSubSkills = await SubSkill.bulkCreate(subSkillsData);
    console.log(`✅ Successfully inserted ${insertedSubSkills.length} sub-skills:`);
    
    // Group by skill for better display
    const skillsMap = {};
    existingSkills.forEach(skill => {
      skillsMap[skill.id] = skill.name;
    });
    
    insertedSubSkills.forEach(subSkill => {
      const skillName = skillsMap[subSkill.skill_id] || `Skill ${subSkill.skill_id}`;
      console.log(`  - [${skillName}] ${subSkill.name}: ${subSkill.description}`);
    });

    console.log('\n🎉 Sub-skills insertion completed successfully!');

  } catch (error) {
    console.error('❌ Error inserting sub-skills:', error);
  } finally {
    // Close database connection
    await sequelize.close();
    console.log('🔌 Database connection closed.');
  }
}

// Alternative function to upsert sub-skills (insert or update)
async function upsertSubSkills() {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');

    // Sync the models
    await sequelize.sync({ force: false });
    console.log('✅ Database synchronized.');

    // Check if skills exist first
    const existingSkills = await Skill.findAll();
    if (existingSkills.length === 0) {
      console.error('❌ No skills found in the database. Please run the skills insertion script first.');
      console.error('Run: npm run insert-skills');
      return;
    }
    console.log(`✅ Found ${existingSkills.length} skills in the database.`);

    // Upsert sub-skills (insert if not exists, update if exists)
    console.log('🔄 Upserting sub-skills...');
    
    const skillsMap = {};
    existingSkills.forEach(skill => {
      skillsMap[skill.id] = skill.name;
    });
    
    for (const subSkillData of subSkillsData) {
      const [subSkill, created] = await SubSkill.findOrCreate({
        where: { 
          skill_id: subSkillData.skill_id,
          name: subSkillData.name
        },
        defaults: subSkillData
      });
      
      const skillName = skillsMap[subSkill.skill_id] || `Skill ${subSkill.skill_id}`;
      
      if (created) {
        console.log(`✅ Created: [${skillName}] ${subSkill.name}`);
      } else {
        // Update description if sub-skill exists
        await subSkill.update({ description: subSkillData.description });
        console.log(`🔄 Updated: [${skillName}] ${subSkill.name}`);
      }
    }

    console.log('\n🎉 Sub-skills upsert completed successfully!');

  } catch (error) {
    console.error('❌ Error upserting sub-skills:', error);
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
    console.log('🚀 Starting sub-skills upsert...');
    upsertSubSkills();
  } else {
    console.log('🚀 Starting sub-skills insertion...');
    insertSubSkills();
  }
}

module.exports = {
  insertSubSkills,
  upsertSubSkills,
  subSkillsData
};
