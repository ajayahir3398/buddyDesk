const express = require('express');
const skillsController = require('../controllers/skills.controller');
const { authenticateToken } = require('../middlewares/auth');

const router = express.Router();

// Apply authentication middleware to all skills routes
router.use(authenticateToken);

// Routes
router.get('/', skillsController.getAllSkills);
router.get('/:id', skillsController.getSkillById);
router.get('/sub-skills/all', skillsController.getAllSubSkills);
router.get('/sub-skills/:skillId', skillsController.getSubSkillsBySkillId);

module.exports = router; 