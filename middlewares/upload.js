const multer = require('multer');
const path = require('path');
const fs = require('fs');
const constants = require('../utils/constants');
const logger = require('../utils/logger');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
const postsUploadsDir = path.join(uploadsDir, 'posts');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

if (!fs.existsSync(postsUploadsDir)) {
  fs.mkdirSync(postsUploadsDir, { recursive: true });
}

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, postsUploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExtension = path.extname(file.originalname);
    const fileName = `post-${uniqueSuffix}${fileExtension}`;
    cb(null, fileName);
  }
});

// File filter function
const fileFilter = (req, file, cb) => {
  // Check if file type is allowed
  if (constants.FILE_UPLOAD.ALLOWED_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} is not allowed. Allowed types: ${constants.FILE_UPLOAD.ALLOWED_TYPES.join(', ')}`), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: constants.FILE_UPLOAD.MAX_SIZE,
    files: 5 // Maximum 5 files per post
  },
  fileFilter: fileFilter
});

// Middleware for handling single file upload
const uploadSingle = upload.single('attachment');

// Middleware for handling multiple files upload
const uploadMultiple = upload.array('attachments', 5);

// Error handling middleware for multer
const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    logger.error('Multer upload error', {
      requestId: req.requestId,
      error: error.message,
      code: error.code
    });

    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(400).json({
          success: false,
          message: `File too large. Maximum size allowed is ${constants.FILE_UPLOAD.MAX_SIZE / (1024 * 1024)}MB`
        });
      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({
          success: false,
          message: 'Too many files. Maximum 5 files allowed per post'
        });
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({
          success: false,
          message: 'Unexpected file field'
        });
      default:
        return res.status(400).json({
          success: false,
          message: 'File upload error: ' + error.message
        });
    }
  } else if (error) {
    logger.error('File upload error', {
      requestId: req.requestId,
      error: error.message
    });

    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
  next();
};

// Helper function to delete uploaded files
const deleteFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      logger.info('File deleted successfully', { filePath });
    }
  } catch (error) {
    logger.error('Error deleting file', { filePath, error: error.message });
  }
};

// Helper function to get file URL
const getFileUrl = (filePath) => {
  // Remove the uploads directory prefix and return relative path
  return filePath.replace(path.join(__dirname, '../'), '');
};

module.exports = {
  uploadSingle,
  uploadMultiple,
  handleUploadError,
  deleteFile,
  getFileUrl,
  storage,
  uploadsDir,
  postsUploadsDir
};