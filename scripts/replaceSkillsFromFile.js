// Load environment variables from .env file
require('dotenv').config();

const { Sequelize, DataTypes } = require('sequelize');
const fs = require('fs');
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

// Import the models from the centralized index
const db = require('../models/index.js');
const Skill = db.Skill;
const SubSkill = db.SubSkill;
const UserSkill = db.UserSkill;
const Post = db.Post;

// Function to parse the skillList.txt file
function parseSkillFile(filePath) {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const lines = fileContent.split('\n').map(line => line.trim()).filter(line => line);
    
    const skills = [];
    let currentSkill = null;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Check if it's a main skill (no asterisk at the beginning)
      if (!line.startsWith('*')) {
        // If we have a previous skill, add it to the array
        if (currentSkill) {
          skills.push(currentSkill);
        }
        
        // Create new skill
        currentSkill = {
          name: line,
          description: `Skills and services related to ${line.toLowerCase()}`,
          subSkills: []
        };
      } else if (currentSkill && line.startsWith('*')) {
        // This is a subskill
        const subSkillName = line.substring(1).trim();
        if (subSkillName) {
          currentSkill.subSkills.push({
            name: subSkillName,
            description: `${subSkillName} services and assistance`
          });
        }
      }
    }
    
    // Add the last skill
    if (currentSkill) {
      skills.push(currentSkill);
    }
    
    return skills;
  } catch (error) {
    console.error('❌ Error parsing skill file:', error);
    return [];
  }
}

// Function to replace skills and subskills
async function replaceSkillsFromFile(filePath, options = {}) {
  const { backup = true, dryRun = false } = options;
  
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');

    // Parse the skill file
    console.log('📖 Parsing skill file...');
    const newSkills = parseSkillFile(filePath);
    
    if (newSkills.length === 0) {
      console.error('❌ No skills found in the file or error parsing file.');
      return;
    }
    
    console.log(`✅ Parsed ${newSkills.length} main skills from file.`);
    
    // Count total subskills
    const totalSubSkills = newSkills.reduce((sum, skill) => sum + skill.subSkills.length, 0);
    console.log(`✅ Found ${totalSubSkills} sub-skills total.`);
    
    if (dryRun) {
      console.log('\n🔍 DRY RUN - No changes will be made:');
      newSkills.forEach((skill, index) => {
        console.log(`\n${index + 1}. ${skill.name} (${skill.subSkills.length} sub-skills)`);
        skill.subSkills.forEach((subSkill, subIndex) => {
          console.log(`   ${subIndex + 1}. ${subSkill.name}`);
        });
      });
      return;
    }

    // Start transaction
    const transaction = await sequelize.transaction();
    
    try {
      // Backup existing data if requested
      if (backup) {
        console.log('💾 Creating backup of existing skills...');
        const existingSkills = await Skill.findAll({ 
          include: [{ model: SubSkill, as: 'subSkills' }],
          transaction 
        });
        
        const backupData = {
          skills: existingSkills.map(skill => ({
            id: skill.id,
            name: skill.name,
            description: skill.description,
            subSkills: skill.subSkills.map(sub => ({
              id: sub.id,
              name: sub.name,
              description: sub.description
            }))
          })),
          timestamp: new Date().toISOString()
        };
        
        const backupPath = path.join(__dirname, `skills_backup_${Date.now()}.json`);
        fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));
        console.log(`✅ Backup saved to: ${backupPath}`);
      }

      // Clear existing data (in correct order due to foreign key constraints)
      console.log('🗑️  Clearing existing skills data...');
      
      // First, clear user_skills and posts that reference sub_skills
      await UserSkill.destroy({ where: {}, transaction });
      console.log('✅ Cleared user_skills table');
      
      await Post.update(
        { required_sub_skill_id: null, required_skill_id: null },
        { where: {}, transaction }
      );
      console.log('✅ Cleared skill references from posts');
      
      // Then clear sub_skills
      await SubSkill.destroy({ where: {}, transaction });
      console.log('✅ Cleared sub_skills table');
      
      // Finally clear skills
      await Skill.destroy({ where: {}, transaction });
      console.log('✅ Cleared skills table');

      // Reset auto-increment counters
      await sequelize.query('ALTER SEQUENCE skills_id_seq RESTART WITH 1', { transaction });
      await sequelize.query('ALTER SEQUENCE sub_skills_id_seq RESTART WITH 1', { transaction });
      console.log('✅ Reset auto-increment sequences');

      // Insert new skills
      console.log('➕ Inserting new skills...');
      const insertedSkills = [];
      
      for (const skillData of newSkills) {
        const skill = await Skill.create({
          name: skillData.name,
          description: skillData.description
        }, { transaction });
        
        insertedSkills.push(skill);
        console.log(`✅ Created skill: ${skill.name} (ID: ${skill.id})`);
      }

      // Insert sub-skills
      console.log('➕ Inserting sub-skills...');
      let subSkillCount = 0;
      
      for (let i = 0; i < newSkills.length; i++) {
        const skillData = newSkills[i];
        const skill = insertedSkills[i];
        
        for (const subSkillData of skillData.subSkills) {
          await SubSkill.create({
            skill_id: skill.id,
            name: subSkillData.name,
            description: subSkillData.description
          }, { transaction });
          
          subSkillCount++;
        }
        
        console.log(`✅ Added ${skillData.subSkills.length} sub-skills to ${skill.name}`);
      }

      // Commit transaction
      await transaction.commit();
      
      console.log('\n🎉 Skills replacement completed successfully!');
      console.log(`✅ Inserted ${insertedSkills.length} main skills`);
      console.log(`✅ Inserted ${subSkillCount} sub-skills`);
      
      // Display summary
      console.log('\n📊 Summary of new skills:');
      insertedSkills.forEach((skill, index) => {
        const subSkillCount = newSkills[index].subSkills.length;
        console.log(`${index + 1}. ${skill.name} (${subSkillCount} sub-skills)`);
      });

    } catch (error) {
      // Rollback transaction on error
      await transaction.rollback();
      throw error;
    }

  } catch (error) {
    console.error('❌ Error replacing skills:', error);
  } finally {
    // Close database connection
    await sequelize.close();
    console.log('🔌 Database connection closed.');
  }
}

// Function to show current skills in database
async function showCurrentSkills() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');

    const skills = await Skill.findAll({
      include: [{ model: SubSkill, as: 'subSkills' }]
    });
    
    console.log(`\n📊 Current skills in database (${skills.length} total):`);
    skills.forEach((skill, index) => {
      console.log(`${index + 1}. ${skill.name} (${skill.subSkills.length} sub-skills)`);
      skill.subSkills.forEach((subSkill, subIndex) => {
        console.log(`   ${subIndex + 1}. ${subSkill.name}`);
      });
    });

  } catch (error) {
    console.error('❌ Error showing current skills:', error);
  } finally {
    await sequelize.close();
  }
}

// Main execution
if (require.main === module) {
  const args = process.argv.slice(2);
  const skillFilePath = path.join(__dirname, '..', 'skillList.txt');
  
  if (args.includes('--show-current')) {
    console.log('🔍 Showing current skills in database...');
    showCurrentSkills();
  } else if (args.includes('--dry-run')) {
    console.log('🔍 Running dry run (no changes will be made)...');
    replaceSkillsFromFile(skillFilePath, { backup: false, dryRun: true });
  } else if (args.includes('--no-backup')) {
    console.log('🚀 Replacing skills without backup...');
    replaceSkillsFromFile(skillFilePath, { backup: false, dryRun: false });
  } else {
    console.log('🚀 Replacing skills with backup...');
    replaceSkillsFromFile(skillFilePath, { backup: true, dryRun: false });
  }
}

module.exports = {
  replaceSkillsFromFile,
  parseSkillFile,
  showCurrentSkills
};
