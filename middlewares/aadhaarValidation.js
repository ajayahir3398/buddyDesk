const { body, param, query } = require('express-validator');

/**
 * Validation middleware for Aadhaar XML verification
 */
const validateXMLVerification = [
    body('xmlData')
        .notEmpty()
        .withMessage('XML data is required')
        .isBase64()
        .withMessage('XML data must be valid base64 encoded string')
        .isLength({ min: 100 })
        .withMessage('XML data appears to be too short'),
    
    body('shareCode')
        .notEmpty()
        .withMessage('Share code is required')
        .isNumeric()
        .withMessage('Share code must contain only numbers')
        .isLength({ min: 4, max: 4 })
        .withMessage('Share code must be exactly 4 digits'),
];

/**
 * Validation middleware for QR code verification
 */
const validateQRVerification = [
    // File validation will be handled by multer middleware
    // Additional validations can be added here if needed
];

/**
 * Validation middleware for Aadhaar number validation
 */
const validateAadhaarNumber = [
    body('aadhaarNumber')
        .notEmpty()
        .withMessage('Aadhaar number is required')
        .custom((value) => {
            // Remove spaces for validation
            const cleanValue = value.replace(/\s/g, '');
            
            // Check if it's exactly 12 digits
            if (!/^\d{12}$/.test(cleanValue)) {
                throw new Error('Aadhaar number must be exactly 12 digits');
            }
            
            // Check for obviously invalid patterns
            if (/^0{12}$/.test(cleanValue) || /^1{12}$/.test(cleanValue)) {
                throw new Error('Invalid Aadhaar number pattern');
            }
            
            return true;
        })
        .customSanitizer((value) => {
            // Sanitize by removing extra spaces and formatting
            return value.replace(/\s+/g, ' ').trim();
        }),
];

/**
 * Validation middleware for verification history pagination
 */
const validateVerificationHistory = [
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be an integer between 1 and 100')
        .toInt(),
    
    query('offset')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Offset must be a non-negative integer')
        .toInt(),
];

/**
 * Validation middleware for verification details by ID
 */
const validateVerificationId = [
    param('verificationId')
        .notEmpty()
        .withMessage('Verification ID is required')
        .isUUID()
        .withMessage('Verification ID must be a valid UUID'),
];

/**
 * Security validation middleware to check file size and type for QR uploads
 */
const validateQRImageFile = (req, res, next) => {
    if (!req.file) {
        return res.status(400).json({
            success: false,
            requestId: req.requestId,
            message: 'QR image file is required'
        });
    }

    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (req.file.size > maxSize) {
        return res.status(400).json({
            success: false,
            requestId: req.requestId,
            message: 'File size too large. Maximum allowed size is 5MB'
        });
    }

    // Check file type
    const allowedMimeTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/bmp',
        'image/gif',
        'image/webp'
    ];

    if (!allowedMimeTypes.includes(req.file.mimetype)) {
        return res.status(400).json({
            success: false,
            requestId: req.requestId,
            message: 'Invalid file type. Only image files are allowed'
        });
    }

    // Check if file has valid image header
    const imageHeaders = {
        'image/jpeg': [0xFF, 0xD8, 0xFF],
        'image/png': [0x89, 0x50, 0x4E, 0x47],
        'image/bmp': [0x42, 0x4D],
        'image/gif': [0x47, 0x49, 0x46],
        'image/webp': [0x52, 0x49, 0x46, 0x46]
    };

    const buffer = req.file.buffer;
    let isValidImage = false;

    for (const [mimeType, header] of Object.entries(imageHeaders)) {
        if (req.file.mimetype === mimeType) {
            isValidImage = header.every((byte, index) => buffer[index] === byte);
            break;
        }
    }

    if (!isValidImage) {
        return res.status(400).json({
            success: false,
            requestId: req.requestId,
            message: 'Invalid image file format'
        });
    }

    next();
};

/**
 * Rate limiting validation for verification requests
 */
const validateVerificationRateLimit = (req, res, next) => {
    // This can be enhanced with Redis or in-memory store for rate limiting
    // For now, we'll just add the middleware structure
    // You can integrate with express-rate-limit or similar packages
    
    // Example rate limit: 10 verifications per hour per user
    // This would be implemented with a proper rate limiting solution
    
    next();
};

/**
 * Sanitization middleware to remove sensitive data from logs
 */
const sanitizeRequest = (req, res, next) => {
    // Create a sanitized version of the request for logging
    req.sanitizedBody = { ...req.body };
    
    // Remove sensitive data from logs
    if (req.sanitizedBody.xmlData) {
        req.sanitizedBody.xmlData = '[REDACTED_XML_DATA]';
    }
    
    if (req.sanitizedBody.aadhaarNumber) {
        const aadhaar = req.sanitizedBody.aadhaarNumber.replace(/\s/g, '');
        req.sanitizedBody.aadhaarNumber = `XXXX XXXX ${aadhaar.slice(-4)}`;
    }
    
    if (req.sanitizedBody.shareCode) {
        req.sanitizedBody.shareCode = '[REDACTED_SHARE_CODE]';
    }
    
    next();
};

/**
 * Content Security validation
 */
const validateContentSecurity = (req, res, next) => {
    // Check for malicious content in XML data
    if (req.body.xmlData) {
        const xmlData = req.body.xmlData;
        
        // Basic checks for potentially malicious content
        const dangerousPatterns = [
            /<!DOCTYPE[^>]*>/i,
            /<!ENTITY[^>]*>/i,
            /<script[^>]*>/i,
            /javascript:/i,
            /on\w+\s*=/i
        ];
        
        const decodedXML = Buffer.from(xmlData, 'base64').toString('utf-8');
        
        for (const pattern of dangerousPatterns) {
            if (pattern.test(decodedXML)) {
                return res.status(400).json({
                    success: false,
                    requestId: req.requestId,
                    message: 'Invalid XML content detected'
                });
            }
        }
    }
    
    next();
};

module.exports = {
    validateXMLVerification,
    validateQRVerification,
    validateAadhaarNumber,
    validateVerificationHistory,
    validateVerificationId,
    validateQRImageFile,
    validateVerificationRateLimit,
    sanitizeRequest,
    validateContentSecurity
};