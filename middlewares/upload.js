const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const Busboy = require('busboy');
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

// Enhanced file validation function for streaming uploads
const isValidFileType = (mimetype, filename) => {
  // Check if file type is allowed
  if (!constants.FILE_UPLOAD.ALLOWED_TYPES.includes(mimetype)) {
    return { valid: false, error: `File type ${mimetype} is not allowed. Allowed types: ${constants.FILE_UPLOAD.ALLOWED_TYPES.join(', ')}` };
  }

  // Additional security check: validate file extension matches MIME type
  const extension = path.extname(filename).toLowerCase();
  const allowedExtensions = {
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/gif': ['.gif'],
    'image/jpg': ['.jpg', '.jpeg'],
    'audio/mpeg': ['.mp3', '.mpeg'],
    'audio/mp3': ['.mp3'],
    'audio/wav': ['.wav'],
    'audio/ogg': ['.ogg'],
    'application/pdf': ['.pdf'],
    'application/zip': ['.zip'],
    'application/x-zip-compressed': ['.zip'],
    'application/octet-stream': ['.zip', '.bin'] // Allow for potentially misdetected zip files
  };

  const expectedExtensions = allowedExtensions[mimetype];
  if (expectedExtensions && expectedExtensions.includes(extension)) {
    return { valid: true };
  } else {
    return { valid: false, error: `File extension ${extension} doesn't match MIME type ${mimetype}` };
  }
};

// Streaming upload middleware using busboy for optimal performance
const createStreamingUploadMiddleware = (options = {}) => {
  const {
    fieldNames = ['attachments', 'attachment', 'profile_image'],
    maxFiles = 10,
    maxFileSize = constants.FILE_UPLOAD.MAX_SIZE
  } = options;

  return (req, res, next) => {
    // Store files array to maintain compatibility with existing controllers
    req.files = [];
    req.file = null; // For single file uploads
    req.body = {}; // Store form data

    let filesProcessed = 0;
    let totalSize = 0;
    const errors = [];

    const busboy = Busboy({ 
      headers: req.headers,
      limits: {
        fileSize: maxFileSize,
        files: maxFiles + 1 // Allow one extra to detect overflow
      }
    });

    busboy.on('field', (fieldname, value, info) => {
      req.body[fieldname] = value;
    });

    busboy.on('file', (fieldname, file, info) => {
      const { filename, mimeType, encoding } = info;

      // Check file count limit
      if (filesProcessed >= maxFiles) {
        file.resume(); // Drain the stream
        errors.push(`Too many files. Maximum ${maxFiles} files allowed`);
        return;
      }

      // Validate file type
      const validation = isValidFileType(mimeType, filename);
      if (!validation.valid) {
        file.resume(); // Drain the stream
        errors.push(validation.error);
        return;
      }

      // Determine destination directory
      const { dir } = getFileCategory(mimeType);
      if (!dir) {
        file.resume(); // Drain the stream
        errors.push(`Unsupported file category for ${mimeType}`);
        return;
      }

      // Generate unique filename
      const uniqueId = uuidv4();
      const extension = path.extname(filename).toLowerCase();
      const fileName = `${uniqueId}${extension}`;
      const filePath = path.join(dir, fileName);

      // Create write stream
      const writeStream = fs.createWriteStream(filePath);
      let fileSize = 0;
      let isComplete = false;

      // Handle file stream
      file.on('data', (chunk) => {
        fileSize += chunk.length;
        totalSize += chunk.length;

        // Check total size limit across all files
        if (totalSize > maxFileSize * maxFiles) { // Allow reasonable total size
          writeStream.destroy();
          file.resume();
          errors.push(`Total upload size exceeds limit`);
          return;
        }

        // Check individual file size limit
        if (fileSize > maxFileSize) {
          writeStream.destroy();
          file.resume();
          fs.unlink(filePath, () => {}); // Cleanup partial file
          errors.push(`File ${filename} too large. Maximum size allowed is ${maxFileSize / (1024 * 1024)}MB`);
          return;
        }

        if (!writeStream.destroyed && !writeStream.writableEnded) {
          writeStream.write(chunk);
        }
      });

      file.on('end', () => {
        if (!writeStream.destroyed && !writeStream.writableEnded) {
          writeStream.end();
        }
      });

      file.on('error', (err) => {
        logger.error('File stream error', {
          requestId: req.requestId,
          filename,
          error: err.message
        });
        if (!writeStream.destroyed && !writeStream.writableEnded) {
          writeStream.destroy();
        }
        fs.unlink(filePath, () => {}); // Cleanup partial file
        errors.push(`Error processing file ${filename}: ${err.message}`);
      });

      writeStream.on('finish', () => {
        filesProcessed++;
        isComplete = true;

        // Create file object compatible with multer format
        const fileObj = {
          fieldname: fieldname,
          originalname: filename,
          encoding: encoding,
          mimetype: mimeType,
          size: fileSize,
          path: filePath,
          destination: dir,
          filename: fileName
        };

        req.files.push(fileObj);

        // For single file uploads, also set req.file
        if (fieldNames.includes(fieldname) && fieldNames.length === 1) {
          req.file = fileObj;
        }

        logger.info('File uploaded successfully via streaming', {
          requestId: req.requestId,
          filename: fileName,
          originalName: filename,
          size: fileSize,
          mimetype: mimeType
        });
      });

      writeStream.on('error', (err) => {
        logger.error('Write stream error', {
          requestId: req.requestId,
          filename,
          error: err.message
        });
        fs.unlink(filePath, () => {}); // Cleanup partial file
        errors.push(`Error saving file ${filename}: ${err.message}`);
      });
    });

    busboy.on('finish', () => {
      if (errors.length > 0) {
        // Cleanup any uploaded files on error
        if (req.files && req.files.length > 0) {
          req.files.forEach(file => {
            deleteFile(file.path);
          });
        }
        
        logger.error('Busboy upload errors', {
          requestId: req.requestId,
          errors,
          filesProcessed
        });

        return res.status(400).json({
          success: false,
          message: errors.join(', '),
          errors: errors
        });
      }

      logger.info('Busboy upload completed', {
        requestId: req.requestId,
        filesProcessed,
        totalSize
      });

      next();
    });

    busboy.on('error', (err) => {
      logger.error('Busboy error', {
        requestId: req.requestId,
        error: err.message
      });

      // Cleanup any uploaded files on error
      if (req.files && req.files.length > 0) {
        req.files.forEach(file => {
          deleteFile(file.path);
        });
      }

      res.status(400).json({
        success: false,
        message: `Upload error: ${err.message}`
      });
    });

    // Pipe request to busboy for processing
    req.pipe(busboy);
  };
};

// New streaming upload middlewares for different use cases
const uploadSingleStreaming = createStreamingUploadMiddleware({
  fieldNames: ['attachment'],
  maxFiles: 1
});

const uploadMultipleStreaming = createStreamingUploadMiddleware({
  fieldNames: ['attachments', 'attachment'],
  maxFiles: 10
});

const uploadProfileImageStreaming = createStreamingUploadMiddleware({
  fieldNames: ['profile_image'],
  maxFiles: 1
});

module.exports = {
  // Original multer-based uploads (kept for backward compatibility)
  uploadSingle,
  uploadMultiple,
  uploadProfileImage,
  handleUploadError,
  
  // New streaming uploads using busboy (recommended for better performance)
  uploadSingleStreaming,
  uploadMultipleStreaming,
  uploadProfileImageStreaming,
  
  // Helper functions
  deleteFile,
  getFileUrl,
  getFileCategoryFromPath,
  validateFileAccess,
  isValidFileType,
  createStreamingUploadMiddleware,
  
  // Configuration
  storage,
  uploadsDir,
  imagesDir,
  audioDir,
  documentsDir
};