const express = require('express');
const userController = require('../controllers/user.controller');
const { authenticateToken } = require('../middlewares/auth');
const {
    validateUserRegistration,
    validateUserLogin,
    validateProfileUpdate,
    validateChangePassword,
    validateForgotPassword,
    validateVerifyOTP,
    validateResetPassword,
    validateResendRegistrationOTP,
} = require('../middlewares/validation');
const { uploadProfileImage, uploadProfileImageStreaming, handleUploadError } = require('../middlewares/upload');
const { validateFileSecurityMiddleware } = require('../middleware/fileSecurityValidation');

const router = express.Router();

/**
 * @swagger
 * /users/register:
 *   post:
 *     summary: "Register a new user (Step 1: Send OTP)"
 *     description: "Initiates user registration by sending an OTP to the provided email address for verification. Validates referral code if provided."
 *     tags:
 *       - Users
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 example: "John Doe"
 *                 description: "User's full name"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "john.doe@example.com"
 *                 description: "User's email address"
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: "SecurePass123"
 *                 description: "User's password"
 *               referred_by:
 *                 type: string
 *                 example: "ABC123"
 *                 description: "Referral code of the user who invited this user"
 *     responses:
 *       '200':
 *         description: "OTP sent successfully"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Verification OTP sent to your email. Please verify your email to complete registration."
 *                 data:
 *                   type: object
 *                   properties:
 *                     email:
 *                       type: string
 *                       example: "john.doe@example.com"
 *                     expiresIn:
 *                       type: integer
 *                       example: 10
 *                       description: "OTP expiration time in minutes"
 *       '400':
 *         description: "Invalid request data or invalid referral code"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       '409':
 *         description: "User already exists or registration in progress"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       '500':
 *         description: "Internal server error"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/register', validateUserRegistration, userController.register);

/**
 * @swagger
 * /users/verify-registration-otp:
 *   post:
 *     summary: "Verify registration OTP (Step 2: Complete registration)"
 *     description: "Verifies the OTP sent to the user's email and completes the user registration"
 *     tags:
 *       - Users
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "john.doe@example.com"
 *                 description: "User's email address"
 *               otp:
 *                 type: string
 *                 example: "123456"
 *                 description: "6-digit OTP received via email"
 *     responses:
 *       '201':
 *         description: "User registered successfully"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "User registered successfully and email verified"
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                           example: 1
 *                         name:
 *                           type: string
 *                           example: "John Doe"
 *                         email:
 *                           type: string
 *                           example: "john.doe@example.com"
 *                         email_verified:
 *                           type: boolean
 *                           example: true
 *                         referral_code:
 *                           type: string
 *                           example: "ABC123"
 *       '400':
 *         description: "Invalid request data, OTP, or registration expired"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       '500':
 *         description: "Internal server error"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/verify-registration-otp', userController.verifyRegistrationOTP);

/**
 * @swagger
 * /users/resend-registration-otp:
 *   post:
 *     summary: "Resend registration OTP"
 *     description: "Resends the verification OTP for pending user registration. Can be used when the original OTP was not received or has expired. Rate limited to 3 resends per registration session."
 *     tags:
 *       - Users
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "john.doe@example.com"
 *                 description: "User's email address for which to resend OTP"
 *     responses:
 *       '200':
 *         description: "OTP resent successfully"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Verification OTP resent to your email. Please verify your email to complete registration."
 *                 data:
 *                   type: object
 *                   properties:
 *                     email:
 *                       type: string
 *                       example: "john.doe@example.com"
 *                     expiresIn:
 *                       type: integer
 *                       example: 10
 *                       description: "OTP expiration time in minutes"
 *       '400':
 *         description: "Invalid request data, no pending registration, or too many resend attempts"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       '500':
 *         description: "Internal server error"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/resend-registration-otp', validateResendRegistrationOTP, userController.resendRegistrationOTP);

/**
 * @swagger
 * /users/login:
 *   post:
 *     summary: "Login user"
 *     description: "Authenticate user with email and password"
 *     tags:
 *       - Users
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "john.doe@example.com"
 *                 description: "User's email address"
 *               password:
 *                 type: string
 *                 example: "SecurePass123"
 *                 description: "User's password"
 *     responses:
 *       '200':
 *         description: "Login successful"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Login successful"
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     accessToken:
 *                       type: string
 *                       example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                       description: "JWT access token"
 *       '401':
 *         description: "Invalid credentials"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       '500':
 *         description: "Internal server error"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/login', validateUserLogin, userController.login);
router.post('/refresh-token', userController.refreshToken);
router.post('/logout', userController.logout);
router.post('/change-password', validateChangePassword, userController.changePassword);

// Forgot password routes
router.post('/forgot-password', validateForgotPassword, userController.forgotPassword);
router.post('/verify-reset-otp', validateVerifyOTP, userController.verifyResetOTP);
router.post('/reset-password', validateResetPassword, userController.resetPassword);

// Profile routes (require authentication)
router.get('/profile', authenticateToken, userController.getProfile);
router.get('/profile/:id', authenticateToken, userController.getProfileById);
router.put('/profile', authenticateToken, uploadProfileImageStreaming, handleUploadError, userController.updateProfile);

// Public profile route (require authentication but allow viewing other users)
router.get('/public-profile/:id', authenticateToken, userController.getPublicProfile);

// Soft delete user account (require authentication)
router.delete('/delete-account', authenticateToken, userController.softDeleteUser);

// Block/Unblock user routes (require authentication)
router.post('/block/:userId', authenticateToken, userController.blockUser);
router.delete('/block/:userId', authenticateToken, userController.unblockUser);
router.get('/blocked-users', authenticateToken, userController.getBlockedUsers);

module.exports = router;