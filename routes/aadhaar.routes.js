const express = require('express');
const multer = require('multer');
const router = express.Router();

// Import middlewares
const { authenticateToken } = require('../middlewares/auth');
const {
    validateXMLVerification,
    validateZIPVerification,
    validateQRVerification,
    validateAadhaarNumber,
    validateVerificationHistory,
    validateVerificationId,
    validateQRImageFile,
    validateZIPFile,
    validateVerificationRateLimit,
    sanitizeRequest,
    validateContentSecurity
} = require('../middlewares/aadhaarValidation');

// Import controller
const aadhaarController = require('../controllers/aadhaar.controller');
const { validateFileSecurityMiddleware } = require('../middleware/fileSecurityValidation');

// Configure multer for QR image uploads and ZIP file uploads
const qrUpload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
        files: 1
    },
    fileFilter: (req, file, cb) => {
        // Check file type
        const allowedMimeTypes = [
            'image/jpeg',
            'image/jpg', 
            'image/png',
            'image/bmp',
            'image/gif',
            'image/webp'
        ];
        
        if (allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only image files are allowed.'), false);
        }
    }
});

// Configure multer for ZIP file uploads
const zipUpload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit for ZIP files
        files: 1
    },
    fileFilter: (req, file, cb) => {
        // Check file type for ZIP files
        const allowedMimeTypes = [
            'application/zip',
            'application/x-zip-compressed',
            'application/octet-stream'
        ];
        
        if (allowedMimeTypes.includes(file.mimetype) || file.originalname.endsWith('.zip')) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only ZIP files are allowed.'), false);
        }
    }
});

// Apply common middlewares to all routes
router.use(authenticateToken); // Authentication required for all Aadhaar routes
router.use(sanitizeRequest); // Sanitize sensitive data for logging
router.use(validateVerificationRateLimit); // Rate limiting

/**
 * @swagger
 * /aadhaar/verify-zip:
 *   post:
 *     summary: Verify Aadhaar ZIP file (offline eKYC)
 *     description: Verifies offline eKYC ZIP files containing XML and certificate files with share code decryption
 *     tags:
 *       - Aadhaar Verification
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/AadhaarZIPVerificationRequest'
 *     responses:
 *       '200':
 *         description: Verification completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AadhaarVerificationResult'
 *       '400':
 *         description: Invalid request data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AadhaarErrorResponse'
 *       '401':
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       '500':
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/verify-zip',
    authenticateToken,
    zipUpload.single('zipFile'),
    validateFileSecurityMiddleware,
    validateZIPFile,
    validateContentSecurity,
    validateZIPVerification,
    aadhaarController.verifyZIP.bind(aadhaarController)
);

/**
 * @swagger
 * /aadhaar/verify-xml:
 *   post:
 *     summary: Verify Aadhaar XML data (offline eKYC)
 *     description: Verifies Aadhaar XML data extracted from offline eKYC
 *     tags:
 *       - Aadhaar Verification
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - xmlData
 *               - shareCode
 *             properties:
 *               xmlData:
 *                 type: string
 *                 description: Base64 encoded XML data
 *               shareCode:
 *                 type: string
 *                 description: Share code for decryption (4 digits)
 *     responses:
 *       '200':
 *         description: Verification completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AadhaarVerificationResult'
 *       '400':
 *         description: Invalid request data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AadhaarErrorResponse'
 *       '401':
 *         description: Unauthorized
 *       '500':
 *         description: Internal server error
 */
router.post('/verify-xml',
    authenticateToken,
    validateXMLVerification,
    validateContentSecurity,
    aadhaarController.verifyXML.bind(aadhaarController)
);

/**
 * @swagger
 * /aadhaar/verify-qr:
 *   post:
 *     summary: Verify Aadhaar QR code
 *     description: Verifies Aadhaar QR codes from image files
 *     tags:
 *       - Aadhaar Verification
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - qrImage
 *             properties:
 *               qrImage:
 *                 type: string
 *                 format: binary
 *                 description: QR code image file (JPEG, PNG, BMP, GIF, WebP - Max 5MB)
 *     responses:
 *       '200':
 *         description: QR verification completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AadhaarVerificationResult'
 *       '400':
 *         description: Invalid request data or file
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AadhaarErrorResponse'
 *       '401':
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       '500':
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/verify-qr',
    authenticateToken,
    qrUpload.single('qrImage'),
    validateFileSecurityMiddleware,
    validateQRImageFile,
    validateQRVerification,
    aadhaarController.verifyQR.bind(aadhaarController)
);

/**
 * @swagger
 * /aadhaar/validate-number:
 *   post:
 *     summary: Validate Aadhaar number format
 *     description: Validates Aadhaar number format and Verhoeff checksum
 *     tags:
 *       - Aadhaar Verification
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AadhaarNumberValidationRequest'
 *     responses:
 *       '200':
 *         description: Number validation completed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AadhaarVerificationResult'
 *       '400':
 *         description: Invalid request data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AadhaarErrorResponse'
 *       '401':
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       '500':
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/validate-number',
    validateAadhaarNumber,
    aadhaarController.validateNumber.bind(aadhaarController)
);

/**
 * @swagger
 * /aadhaar/verification-status:
 *   get:
 *     summary: Get user's Aadhaar verification status
 *     description: Get the current Aadhaar verification status for the authenticated user
 *     tags:
 *       - Aadhaar Verification
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Verification status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     isVerified:
 *                       type: boolean
 *                       example: true
 *                     verificationType:
 *                       type: string
 *                       enum: [XML, QR, NUMBER]
 *                     lastVerifiedAt:
 *                       type: string
 *                       format: date-time
 *       '401':
 *         description: Unauthorized
 *       '500':
 *         description: Internal server error
 */
router.get('/verification-status',
    authenticateToken,
    aadhaarController.getVerificationStatus.bind(aadhaarController)
);

/**
 * @swagger
 * /aadhaar/verification-history:
 *   get:
 *     summary: Get verification history
 *     description: Retrieves verification history for the authenticated user
 *     tags:
 *       - Aadhaar Verification
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of records to return
 *       - name: offset
 *         in: query
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *         description: Number of records to skip
 *     responses:
 *       '200':
 *         description: Verification history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AadhaarVerificationHistory'
 *       '401':
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       '500':
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/verification-history',
    authenticateToken,
    validateVerificationHistory,
    aadhaarController.getVerificationHistory.bind(aadhaarController)
);

/**
 * @swagger
 * /aadhaar/verification/{verificationId}:
 *   get:
 *     summary: Get verification details
 *     description: Retrieves detailed information about a specific verification
 *     tags:
 *       - Aadhaar Verification
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: verificationId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Verification ID
 *     responses:
 *       '200':
 *         description: Verification details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 requestId:
 *                   type: string
 *                   format: uuid
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     verificationId:
 *                       type: string
 *                       format: uuid
 *                     verificationType:
 *                       type: string
 *                       enum: [XML, QR, NUMBER]
 *                     verificationStatus:
 *                       type: string
 *                       enum: [SUCCESS, FAILED, PENDING]
 *                     maskedAadhaarNumber:
 *                       type: string
 *                       example: XXXX XXXX 1234
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *       '401':
 *         description: Unauthorized
 *       '404':
 *         description: Verification not found
 *       '500':
 *         description: Internal server error
 */
router.get('/verification/:verificationId',
    authenticateToken,
    validateVerificationId,
    aadhaarController.getVerificationDetails.bind(aadhaarController)
);

/**
 * Error handler for multer errors
 */
router.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                requestId: req.requestId,
                message: 'File size too large. Maximum allowed size is 5MB'
            });
        }
        
        if (error.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                success: false,
                requestId: req.requestId,
                message: 'Too many files. Only one file is allowed'
            });
        }
        
        if (error.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({
                success: false,
                requestId: req.requestId,
                message: 'Unexpected field name. Use "qrImage" as the field name'
            });
        }
    }
    
    if (error.message.includes('Invalid file type')) {
        return res.status(400).json({
            success: false,
            requestId: req.requestId,
            message: error.message
        });
    }
    
    // Pass other errors to the global error handler
    next(error);
});

module.exports = router;