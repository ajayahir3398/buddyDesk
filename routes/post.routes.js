const express = require('express');
const postController = require('../controllers/post.controller');
const { authenticateToken } = require('../middlewares/auth');
const { validatePostCreation, validatePostUpdate } = require('../middlewares/validation');
const { uploadMultiple, handleUploadError } = require('../middlewares/upload');

const router = express.Router();

// Create a new post with optional file attachments (requires authentication)
router.post('/', authenticateToken, uploadMultiple, handleUploadError, validatePostCreation, postController.addPost);

// Get all posts with optional filtering and pagination (requires authentication)
router.get('/', authenticateToken, postController.getPosts);

// Get matching posts for logged-in user (requires authentication)
router.get('/matching', authenticateToken, postController.getMatchingPosts);

// Get specific post by ID (requires authentication)
router.get('/:id', authenticateToken, postController.getPostById);

// Update existing post (requires authentication)
router.put('/:id', authenticateToken, validatePostUpdate, postController.updatePost);

// Add attachments to existing post (requires authentication)
router.post('/:id/attachments', authenticateToken, uploadMultiple, handleUploadError, postController.addAttachment);

// Download attachment by ID
router.get('/attachments/:attachmentId/download', authenticateToken, postController.downloadAttachment);

// Delete attachment by ID (requires authentication and ownership)
router.delete('/attachments/:attachmentId', authenticateToken, postController.deleteAttachment);

module.exports = router;