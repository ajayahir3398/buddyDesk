const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const constants = require('../utils/constants');
const logger = require('../utils/logger');

// Base uploads directory
const uploadsDir = path.join(__dirname, '../uploads');
const imagesDir = path.join(uploadsDir, 'images');
const audioDir = path.join(uploadsDir, 'audio');
const documentsDir = path.join(uploadsDir, 'documents');

// Ensure all directories exist
const directories = [uploadsDir, imagesDir, audioDir, documentsDir];
directories.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Helper function to determine file category and destination
const getFileCategory = (mimetype) => {
  if (constants.FILE_UPLOAD.CATEGORIES.IMAGE.includes(mimetype)) {
    return { category: 'images', dir: imagesDir };
  } else if (constants.FILE_UPLOAD.CATEGORIES.AUDIO.includes(mimetype)) {
    return { category: 'audio', dir: audioDir };
  } else if (constants.FILE_UPLOAD.CATEGORIES.DOCUMENT.includes(mimetype)) {
    return { category: 'documents', dir: documentsDir };
  }
};

// Enhanced storage configuration with organized structure
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const { dir } = getFileCategory(file.mimetype);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    // Use UUID for security (prevents filename guessing attacks)
    const uniqueId = uuidv4();
    const extension = path.extname(file.originalname).toLowerCase();
    const fileName = `${uniqueId}${extension}`;
    cb(null, fileName);
  }
});

// Enhanced file filter with better validation
const fileFilter = (req, file, cb) => {
  // Check if file type is allowed
  if (constants.FILE_UPLOAD.ALLOWED_TYPES.includes(file.mimetype)) {
    // Additional security check: validate file extension matches MIME type
    const extension = path.extname(file.originalname).toLowerCase();
    const allowedExtensions = {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/gif': ['.gif'],
      'image/jpg': ['.jpg', '.jpeg'],
      'audio/mpeg': ['.mp3', '.mpeg'],
      'audio/mp3': ['.mp3'],
      'audio/wav': ['.wav'],
      'audio/ogg': ['.ogg'],
      'application/pdf': ['.pdf']
    };

    const expectedExtensions = allowedExtensions[file.mimetype];
    if (expectedExtensions && expectedExtensions.includes(extension)) {
      cb(null, true);
    } else {
      cb(new Error(`File extension ${extension} doesn't match MIME type ${file.mimetype}`), false);
    }
  } else {
    cb(new Error(`File type ${file.mimetype} is not allowed. Allowed types: ${constants.FILE_UPLOAD.ALLOWED_TYPES.join(', ')}`), false);
  }
};

// Configure multer with enhanced settings
const upload = multer({
  storage: storage,
  limits: {
    fileSize: constants.FILE_UPLOAD.MAX_SIZE,
    files: 10 // Increased from 5 to 10 files per post
  },
  fileFilter: fileFilter
});

// Middleware for handling single file upload
const uploadSingle = upload.single('attachment');

// Middleware for handling multiple files upload
const uploadMultiple = upload.array('attachments', 10);

// Middleware for handling profile image upload
const uploadProfileImage = upload.single('profile_image');

// Enhanced error handling middleware for multer
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
          message: 'Too many files. Maximum 10 files allowed per post'
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

// Enhanced helper function to delete uploaded files
const deleteFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      logger.info('File deleted successfully', { filePath });
      return true;
    }
  } catch (error) {
    logger.error('Error deleting file', { filePath, error: error.message });
  }
  return false;
};

// Enhanced helper function to get file URL with proper categorization
const getFileUrl = (filePath) => {
  try {
    // Extract the relative path from uploads directory
    const relativePath = path.relative(uploadsDir, filePath);
    // Ensure forward slashes for web URLs (cross-platform compatibility)
    return relativePath.replace(/\\/g, '/');
  } catch (error) {
    logger.error('Error generating file URL', { filePath, error: error.message });
    return null;
  }
};

// New helper function to get file category from path
const getFileCategoryFromPath = (filePath) => {
  const relativePath = path.relative(uploadsDir, filePath);
  const category = relativePath.split(path.sep)[0];
  return category;
};

// New helper function to validate file exists and is accessible
const validateFileAccess = (filePath) => {
  try {
    const fullPath = path.resolve(filePath);
    // Security check: ensure file is within uploads directory
    if (!fullPath.startsWith(path.resolve(uploadsDir))) {
      return false;
    }
    return fs.existsSync(fullPath);
  } catch (error) {
    return false;
  }
};

module.exports = {
  uploadSingle,
  uploadMultiple,
  uploadProfileImage,
  handleUploadError,
  deleteFile,
  getFileUrl,
  getFileCategoryFromPath,
  validateFileAccess,
  storage,
  uploadsDir,
  imagesDir,
  audioDir,
  documentsDir
};