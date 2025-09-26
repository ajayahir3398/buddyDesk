const express = require('express');
const userController = require('../controllers/user.controller');
const { authenticateToken } = require('../middlewares/auth');
const {
    validateUserRegistration,
    validateUserLogin,
    validateProfileUpdate,
    validateChangePassword,
} = require('../middlewares/validation');
const { uploadProfileImage, handleUploadError } = require('../middlewares/upload');
const { validateFileSecurityMiddleware } = require('../middleware/fileSecurityValidation');

const router = express.Router();

// Routes
router.post('/register', validateUserRegistration, userController.register);
router.post('/login', validateUserLogin, userController.login);
router.post('/refresh-token', userController.refreshToken);
router.post('/logout', userController.logout);
router.post('/change-password', validateChangePassword, userController.changePassword);

// Profile routes (require authentication)
router.get('/profile', authenticateToken, userController.getProfile);
router.get('/profile/:id', authenticateToken, userController.getProfileById);
router.put('/profile', authenticateToken, uploadProfileImage, validateFileSecurityMiddleware, handleUploadError, userController.updateProfile);

// Public profile route (require authentication but allow viewing other users)
router.get('/public-profile/:id', authenticateToken, userController.getPublicProfile);

module.exports = router;