const express = require('express');
const postController = require('../controllers/post.controller');
const { authenticateToken } = require('../middlewares/auth');
const { validatePostCreation, validatePostUpdate } = require('../middlewares/validation');
const { uploadMultiple, handleUploadError } = require('../middlewares/upload');
const { validateFileSecurityMiddleware } = require('../middleware/fileSecurityValidation');
const { checkUserBlocked } = require('../middlewares/blockCheck');

const router = express.Router();

// Create a new post with optional file attachments (requires authentication and user not blocked)
router.post('/', authenticateToken, checkUserBlocked, uploadMultiple, validateFileSecurityMiddleware, handleUploadError, validatePostCreation, postController.addPost);

// Get all posts with optional filtering and pagination (requires authentication)
router.get('/', authenticateToken, postController.getPosts);

// Get matching posts for logged-in user (requires authentication)
router.get('/matching', authenticateToken, postController.getMatchingPosts);

// Get posts filtered by user's temporary address pincode (requires authentication)
router.get('/temp-address', authenticateToken, postController.getPostsByTempAddressPincode);

// Get specific post by ID (requires authentication)
router.get('/:id', authenticateToken, postController.getPostById);

// Update existing post (requires authentication)
router.put('/:id', authenticateToken, validatePostUpdate, postController.updatePost);

// Add attachments to existing post (requires authentication)
router.post('/:id/attachments', authenticateToken, uploadMultiple, validateFileSecurityMiddleware, handleUploadError, postController.addAttachment);

// Download attachment by ID
router.get('/attachments/:attachmentId/download', authenticateToken, postController.downloadAttachment);

// Delete attachment by ID (requires authentication and ownership)
router.delete('/attachments/:attachmentId', authenticateToken, postController.deleteAttachment);

// Report a post (requires authentication)
router.post('/:id/report', authenticateToken, postController.reportPost);

// Get user's reported posts (requires authentication)
router.get('/reports/my-reports', authenticateToken, postController.getUserReportedPosts);

// Swipe post (left = hide for 120 days, right = hide permanently) (requires authentication)
router.post('/:id/swipe', authenticateToken, postController.swipePost);

// Get user's swiped posts (requires authentication)
router.get('/swipes/my-swipes', authenticateToken, postController.getUserSwipedPosts);

// New enhanced file serving routes (requires authentication)
// Moved to a more generic route - this endpoint now serves all file types
// router.get('/files/:category/:filename', postController.serveFileByCategory);

module.exports = router;