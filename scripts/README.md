# Skills and Sub-Skills Insertion Scripts

These scripts insert predefined skills and sub-skills into the BuddyDesk database tables.

## Setup

1. **Create a `.env` file** in the root directory with your database credentials:

```bash
# Database Configuration
DB_HOST=localhost
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=your_database_name
DB_PORT=5432
```

2. **Make sure your database is running** and accessible.

## Usage

### Option 1: Using npm scripts (Recommended)
```bash
# Insert skills (will check for duplicates)
npm run insert-skills

# Upsert skills (insert new, update existing)
npm run insert-skills:upsert

# Insert sub-skills (will check for duplicates)
npm run insert-sub-skills

# Upsert sub-skills (insert new, update existing)
npm run insert-sub-skills:upsert
```

### Option 2: Direct execution
```bash
cd scripts
node insertSkills.js

# Or with upsert flag
node insertSkills.js --upsert

# For sub-skills
node insertSubSkills.js

# Or with upsert flag
node insertSubSkills.js --upsert
```

### Option 3: Using the batch file (Windows)
```bash
cd scripts
.\run-insert-skills.bat

# For sub-skills
.\run-insert-sub-skills.bat
```

## What it does

### Skills Script
- Connects to your PostgreSQL database
- Inserts 18 predefined skills with descriptions
- Provides detailed feedback on the process
- Handles errors gracefully
- Can upsert existing skills to avoid duplicates

### Sub-Skills Script
- Connects to your PostgreSQL database
- Inserts 95 predefined sub-skills with descriptions
- Links each sub-skill to its parent skill via skill_id
- Provides detailed feedback on the process
- Handles errors gracefully
- Can upsert existing sub-skills to avoid duplicates
- **Requires skills to be inserted first**

## Skills included

- Academic Help
- Art & Creativity
- Cooking & Food
- Creative Skills
- Education & Tutoring
- Event & Fest Skills
- Fashion & Grooming
- Fitness & Sports
- Freelancing & Side Hustles
- Fun & Personal
- Language & Communication
- Lifestyle & Well-being
- Music & Dance
- Parenting & Home
- Personality & Communication
- Repairs & Fixes
- Tech & Digital Skills
- Travel & Local Help

## Sub-Skills included

The sub-skills script inserts 95 sub-skills across all 18 main skills, including:

- **Academic Help (5 sub-skills)**: Assignment Proofreading, College Project Guidance, Exam Notes Sharing, etc.
- **Art & Creativity (6 sub-skills)**: Animation, Drawing & Sketching, Graphic Design, etc.
- **Cooking & Food (5 sub-skills)**: Baking, Cooking Lessons, Meal Planning, etc.
- **Creative Skills (5 sub-skills)**: Instagram Reels Editing, Logo Making, Meme Making, etc.
- **Education & Tutoring (5 sub-skills)**: English, Exam Preparation, Maths, Science, etc.
- **Event & Fest Skills (5 sub-skills)**: Anchoring Tips, Decoration Crafts, Event Management, etc.
- **Fashion & Grooming (5 sub-skills)**: Hair Styling, Makeup, Mehendi Art, etc.
- **Fitness & Sports (7 sub-skills)**: Diet Plans, Home Workout, Martial Arts, etc.
- **Freelancing & Side Hustles (5 sub-skills)**: Cryptocurrency, Freelance Setup, Instagram Growth, etc.
- **Fun & Personal (5 sub-skills)**: Gaming Partner, Movie Night Planner, Netflix Recommendations, etc.
- **Language & Communication (5 sub-skills)**: Content Writing, Interview Practice, Presentation Skills, etc.
- **Lifestyle & Well-being (5 sub-skills)**: Goal Planning, Habit Building, Life Coaching, etc.
- **Music & Dance (7 sub-skills)**: Beatboxing, Classical Dance, DJing, Guitar, etc.
- **Parenting & Home (5 sub-skills)**: Baby Sitting, Home Organization, Kids Homework Help, etc.
- **Personality & Communication (5 sub-skills)**: Debating, English Speaking Buddy, Interview Preparation, etc.
- **Repairs & Fixes (5 sub-skills)**: Bicycle Repair, Electrician Help, Home Appliance Fixing, etc.
- **Tech & Digital Skills (6 sub-skills)**: App Development, Excel/Sheets, Social Media Management, etc.
- **Travel & Local Help (9 sub-skills)**: Bike/Car Knowledge, Cheap Travel Hacks, Hostel Cooking, etc.

## Troubleshooting

If you get connection errors:
1. Check your `.env` file has correct database credentials
2. Ensure your database server is running
3. Verify the database exists and is accessible
4. Check if your database requires SSL connections

## Important Notes

- **Run skills insertion first**: The sub-skills script requires skills to be inserted first
- **Order matters**: Always run `npm run insert-skills` before `npm run insert-sub-skills`
- **Foreign key constraints**: Sub-skills reference skills via skill_id, so skills must exist first
