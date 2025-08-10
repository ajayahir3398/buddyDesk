const express = require('express');
const multer = require('multer');
const router = express.Router();

// Import middlewares
const { authenticateToken } = require('../middlewares/auth');
const {
    validateXMLVerification,
    validateQRVerification,
    validateAadhaarNumber,
    validateVerificationHistory,
    validateVerificationId,
    validateQRImageFile,
    validateVerificationRateLimit,
    sanitizeRequest,
    validateContentSecurity
} = require('../middlewares/aadhaarValidation');

// Import controller
const aadhaarController = require('../controllers/aadhaar.controller');

// Configure multer for QR image uploads
const upload = multer({
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

// All Swagger documentation for Aadhaar verification APIs is defined in config/swagger.config.js

// Apply common middlewares to all routes
router.use(authenticateToken); // Authentication required for all Aadhaar routes
router.use(sanitizeRequest); // Sanitize sensitive data for logging
router.use(validateVerificationRateLimit); // Rate limiting

/**
 * POST /api/aadhaar/verify-xml
 * Verify Aadhaar XML file (offline eKYC)
 */
router.post('/verify-xml',
    validateContentSecurity,
    validateXMLVerification,
    aadhaarController.verifyXML.bind(aadhaarController)
);

/**
 * POST /api/aadhaar/verify-qr
 * Verify Aadhaar QR code from image
 */
router.post('/verify-qr',
    upload.single('qrImage'),
    validateQRImageFile,
    validateQRVerification,
    aadhaarController.verifyQR.bind(aadhaarController)
);

/**
 * POST /api/aadhaar/validate-number
 * Validate Aadhaar number format and checksum
 */
router.post('/validate-number',
    validateAadhaarNumber,
    aadhaarController.validateNumber.bind(aadhaarController)
);

/**
 * GET /api/aadhaar/verification-history
 * Get verification history for the authenticated user
 */
router.get('/verification-history',
    validateVerificationHistory,
    aadhaarController.getVerificationHistory.bind(aadhaarController)
);

/**
 * GET /api/aadhaar/verification/:verificationId
 * Get details of a specific verification
 */
router.get('/verification/:verificationId',
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