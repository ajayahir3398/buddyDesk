# Skills and Sub-skills Replacement Guide

This guide explains how to replace the skills and sub-skills in the BuddyDesk database with data from the `skillList.txt` file.

## Overview

The `scripts/replaceSkillsFromFile.js` script allows you to completely replace the existing skills and sub-skills in the database with new data parsed from the `skillList.txt` file. This is useful when you want to update the skill categories and their sub-skills.

## Features

- **Safe Replacement**: Creates a backup of existing data before replacement
- **Foreign Key Handling**: Properly handles foreign key constraints and related tables
- **Transaction Safety**: Uses database transactions to ensure data integrity
- **Dry Run Mode**: Test the replacement without making actual changes
- **Detailed Logging**: Provides comprehensive feedback during the process

## Available Commands

### 1. Replace Skills with Backup (Recommended)
```bash
npm run replace-skills
```
- Creates a backup of existing skills and sub-skills
- Clears existing data and inserts new data from `skillList.txt`
- Safest option for production use

### 2. Dry Run (Test Mode)
```bash
npm run replace-skills:dry-run
```
- Parses the `skillList.txt` file and shows what would be replaced
- No actual changes are made to the database
- Use this to preview the changes before running the actual replacement

### 3. Replace Without Backup
```bash
npm run replace-skills:no-backup
```
- Replaces skills without creating a backup
- Faster execution but no rollback option
- Use only when you're certain about the replacement

### 4. Show Current Skills
```bash
npm run show-skills
```
- Displays all current skills and sub-skills in the database
- Useful for verification after replacement

## File Format

The `skillList.txt` file should follow this format:

```
Main Skill Category 1
* Sub-skill 1
* Sub-skill 2
* Sub-skill 3

Main Skill Category 2
* Sub-skill 1
* Sub-skill 2
```

Example:
```
Programming & Development
* Frontend Development
* Backend Development
* Mobile App Development

Presentation & Design
* Graphic Design
* UI/UX Design
* Video Editing & Visual Effects
```

## Process Details

### What Happens During Replacement

1. **Database Connection**: Establishes connection to the database
2. **File Parsing**: Reads and parses the `skillList.txt` file
3. **Backup Creation** (if enabled): Creates a JSON backup of existing data
4. **Data Clearing**: 
   - Clears `user_skills` table (removes user skill associations)
   - Clears skill references from `posts` table
   - Clears `sub_skills` table
   - Clears `skills` table
   - Resets auto-increment sequences
5. **Data Insertion**:
   - Inserts new main skills
   - Inserts new sub-skills with proper foreign key relationships
6. **Verification**: Provides summary of inserted data

### Backup File

When backup is enabled, a JSON file is created in the `scripts/` directory with the format:
```json
{
  "skills": [
    {
      "id": 1,
      "name": "Skill Name",
      "description": "Skill Description",
      "subSkills": [
        {
          "id": 1,
          "name": "Sub-skill Name",
          "description": "Sub-skill Description"
        }
      ]
    }
  ],
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Important Notes

### Foreign Key Constraints

The script properly handles foreign key constraints by:
- Clearing `user_skills` table first (references both skills and sub-skills)
- Clearing skill references from `posts` table
- Clearing `sub_skills` table (references skills)
- Finally clearing `skills` table

### User Impact

⚠️ **Warning**: This process will affect existing users:
- All user skill associations will be removed
- Posts referencing specific skills/sub-skills will have those references cleared
- Users will need to re-select their skills after the replacement

### Rollback

If you need to rollback:
1. Use the backup JSON file created during replacement
2. Manually restore the data using database tools
3. Or restore from a database backup taken before the replacement

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Ensure `.env` file has correct database credentials
   - Check database server is running

2. **File Not Found**
   - Ensure `skillList.txt` exists in the project root
   - Check file permissions

3. **Foreign Key Constraint Error**
   - The script should handle this automatically
   - If it occurs, check for additional tables referencing skills

### Recovery

If something goes wrong:
1. Check the backup file in `scripts/` directory
2. Restore from database backup if available
3. Contact system administrator for assistance

## Example Usage

```bash
# 1. First, test with dry run
npm run replace-skills:dry-run

# 2. If satisfied with the preview, run the actual replacement
npm run replace-skills

# 3. Verify the results
npm run show-skills
```

## Current Skills Structure

After replacement, the database will contain 23 main skill categories with 274 total sub-skills, including:

- Programming & Development (17 sub-skills)
- Presentation & Design (17 sub-skills)
- Assignment & Project Help (14 sub-skills)
- Tutoring & Coaching (10 sub-skills)
- Marketing & Branding (15 sub-skills)
- Tech Support & IT Services (11 sub-skills)
- Business & Professional Services (14 sub-skills)
- And many more...

This provides a comprehensive skill taxonomy for the BuddyDesk platform.
