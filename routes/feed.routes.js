const express = require('express');
const feedController = require('../controllers/feedController');
const { authenticateToken } = require('../middlewares/auth');
const { uploadMultiple, handleUploadError } = require('../middlewares/upload');
const { validateFileSecurityMiddleware } = require('../middleware/fileSecurityValidation');

const router = express.Router();

// Apply authentication to all feed routes
router.use(authenticateToken);

// Feed Posts
router.post('/posts', uploadMultiple, validateFileSecurityMiddleware, handleUploadError, feedController.createFeedPost);
router.get('/posts', feedController.getFeed);
router.get('/posts/:id', feedController.getFeedPost);
router.delete('/posts/:id', feedController.deleteFeedPost);

// Engagement
router.post('/posts/:id/like', feedController.toggleLike);
router.post('/posts/:id/comment', feedController.addComment);
router.get('/posts/:id/comments', feedController.getComments);
router.post('/posts/:id/share', feedController.sharePost);


// Discovery
router.get('/trending', feedController.getTrendingPosts);

module.exports = router;
