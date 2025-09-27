const express = require('express');
const feedbackController = require('../controllers/feedback.controller');
const { authenticateToken } = require('../middlewares/auth');
const { validateFeedback } = require('../middlewares/validation');

const router = express.Router();

// Create feedback endpoint (requires authentication)
router.post('/', authenticateToken, validateFeedback, feedbackController.createFeedback);

module.exports = router;
