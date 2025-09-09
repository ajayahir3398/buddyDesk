const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const ffmpeg = require('fluent-ffmpeg');
const pdfParse = require('pdf-parse');
const jpeg = require('jpeg-js');
const nsfwDetectionService = require('../services/nsfwDetectionService');
const keywordFilteringService = require('../services/keywordFilteringService');
const videoAnalysisService = require('../services/videoAnalysisService');
const securityLoggingService = require('../services/securityLoggingService');

// Configuration for security validation
const SECURITY_CONFIG = {
  // File size limits (in bytes)
  maxFileSizes: {
    image: 10 * 1024 * 1024, // 10MB
    video: 100 * 1024 * 1024, // 100MB
    document: 50 * 1024 * 1024, // 50MB
    audio: 50 * 1024 * 1024, // 50MB
    default: 25 * 1024 * 1024 // 25MB
  },
  
  // Allowed file types
  allowedMimeTypes: {
    image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'],
    video: ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/webm'],
    document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'],
    audio: ['audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a']
  },
  
  // NSFW detection thresholds
  nsfwThresholds: {
    porn: 0.7,
    sexy: 0.8,
    hentai: 0.7
  },
  
  // Prohibited content patterns
  prohibitedPatterns: [
    /\b(fuck|shit|damn|bitch|asshole|bastard)\b/gi,
    /\b(hate|kill|murder|violence)\b/gi,
    /\b(drug|cocaine|heroin|marijuana)\b/gi
  ]
};

// Security validation class
class FileSecurityValidator {
  constructor() {
    this.initializeNSFWModel();
    
    // Security thresholds
    this.securityThresholds = {
      nsfw: 0.7,
      keyword: 0.6,
      overall: 0.5
    };
  }
  
  async initializeNSFWModel() {
    try {
      // Note: NSFW.js requires TensorFlow which had installation issues
      // For now, we'll implement basic image validation without ML
      console.log('NSFW model initialization skipped due to TensorFlow dependency issues');
    } catch (error) {
      console.error('Failed to initialize NSFW model:', error);
    }
  }
  
  // Main validation function
  async validateFile(file, options = {}) {
    const requestId = crypto.randomUUID();
    const startTime = Date.now();
    const validationResult = {
      isValid: true,
      violations: [],
      fileInfo: {
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        path: file.path
      },
      securityChecks: {
        fileTypeValid: false,
        fileSizeValid: false,
        contentSafe: false,
        malwareFree: false
      },
      requestId
    };
    
    try {
      // 1. File type validation
      await this.validateFileType(file, validationResult);
      
      // 2. File size validation
      await this.validateFileSize(file, validationResult);
      
      // 3. Enhanced content safety validation
      await this.validateEnhancedContentSafety(file, validationResult);
      
      // 4. Basic malware detection
      await this.validateMalware(file, validationResult);
      
      // 5. File integrity check
      await this.validateFileIntegrity(file, validationResult);
      
    } catch (error) {
      validationResult.isValid = false;
      validationResult.violations.push({
        type: 'VALIDATION_ERROR',
        message: `Validation failed: ${error.message}`,
        severity: 'HIGH'
      });
      
      // Log validation error
      await securityLoggingService.logSecurityViolation({
        type: 'VALIDATION_ERROR',
        severity: 'HIGH',
        message: `File validation error: ${error.message}`,
        fileInfo: {
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size
        },
        userId: options.userId,
        ip: options.ip,
        userAgent: options.userAgent,
        violations: validationResult.violations,
        actionTaken: 'FILE_REJECTED',
        requestId
      });
    }
    
    // Final validation result
    validationResult.isValid = validationResult.violations.length === 0;
    validationResult.processingTime = Date.now() - startTime;
    
    // Log the validation result
    await securityLoggingService.logFileUpload({
      status: validationResult.isValid ? 'SUCCESS' : 'REJECTED',
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      hash: validationResult.fileInfo.hash,
      path: file.path,
      userId: options.userId,
      ip: options.ip,
      userAgent: options.userAgent,
      validationResults: validationResult,
      processingTime: validationResult.processingTime,
      requestId
    });
    
    // Log security violations if any
    if (!validationResult.isValid) {
      await securityLoggingService.logSecurityViolation({
        type: 'FILE_VALIDATION_FAILED',
        severity: this.getSeverityLevel(validationResult.violations),
        message: `File validation failed: ${validationResult.violations.map(v => v.message).join(', ')}`,
        fileInfo: validationResult.fileInfo,
        userId: options.userId,
        ip: options.ip,
        userAgent: options.userAgent,
        method: options.method,
        url: options.url,
        violations: validationResult.violations,
        actionTaken: 'FILE_REJECTED',
        requestId
      });
    }
    
    return validationResult;
  }
  
  // File type validation
  async validateFileType(file, result) {
    const fileCategory = this.getFileCategory(file.mimetype);
    
    if (!fileCategory) {
      result.violations.push({
        type: 'INVALID_FILE_TYPE',
        message: `File type ${file.mimetype} is not allowed`,
        severity: 'HIGH'
      });
      return;
    }
    
    const allowedTypes = SECURITY_CONFIG.allowedMimeTypes[fileCategory];
    if (!allowedTypes.includes(file.mimetype)) {
      result.violations.push({
        type: 'INVALID_FILE_TYPE',
        message: `File type ${file.mimetype} is not allowed in category ${fileCategory}`,
        severity: 'HIGH'
      });
      return;
    }
    
    result.securityChecks.fileTypeValid = true;
  }
  
  // File size validation
  async validateFileSize(file, result) {
    const fileCategory = this.getFileCategory(file.mimetype);
    const maxSize = SECURITY_CONFIG.maxFileSizes[fileCategory] || SECURITY_CONFIG.maxFileSizes.default;
    
    if (file.size > maxSize) {
      result.violations.push({
        type: 'FILE_TOO_LARGE',
        message: `File size ${file.size} bytes exceeds maximum allowed size ${maxSize} bytes`,
        severity: 'MEDIUM'
      });
      return;
    }
    
    result.securityChecks.fileSizeValid = true;
  }
  
  // Enhanced content safety validation
  async validateEnhancedContentSafety(file, result) {
    const fileCategory = this.getFileCategory(file.mimetype);
    
    try {
      result.securityAnalysis = {
        nsfw: null,
        keywords: null,
        video: null,
        overall: {
          riskScore: 0,
          riskLevel: 'low'
        }
      };
      
      let totalRiskScore = 0;
      const riskFactors = [];
      
      switch (fileCategory) {
        case 'image':
          await this.validateImageContentEnhanced(file, result, riskFactors);
          break;
        case 'video':
          await this.validateVideoContentEnhanced(file, result, riskFactors);
          break;
        case 'document':
          await this.validateDocumentContentEnhanced(file, result, riskFactors);
          break;
        case 'audio':
          await this.validateAudioContent(file, result);
          break;
        default:
          result.securityChecks.contentSafe = true;
      }
      
      // Calculate overall risk assessment
      totalRiskScore = riskFactors.reduce((sum, factor) => sum + factor.score, 0);
      result.securityAnalysis.overall.riskScore = Math.min(1.0, totalRiskScore);
      result.securityAnalysis.overall.riskLevel = this.calculateRiskLevel(totalRiskScore);
      result.securityAnalysis.overall.riskFactors = riskFactors.map(f => f.type);
      
      // Final validation based on overall risk
      if (result.securityAnalysis.overall.riskScore > this.securityThresholds.overall && result.securityChecks.contentSafe) {
        if (riskFactors.length >= 2 || result.securityAnalysis.overall.riskScore > 0.8) {
          result.securityChecks.contentSafe = false;
          result.violations.push({
            type: 'HIGH_RISK_CONTENT',
            message: 'Content flagged due to multiple risk factors',
            severity: 'HIGH',
            riskScore: result.securityAnalysis.overall.riskScore,
            riskFactors: riskFactors.map(f => f.type)
          });
        }
      }
      
    } catch (error) {
      result.violations.push({
        type: 'CONTENT_VALIDATION_ERROR',
        message: `Content validation failed: ${error.message}`,
        severity: 'MEDIUM'
      });
    }
  }
  
  // Enhanced image content validation
  async validateImageContentEnhanced(file, result, riskFactors) {
    try {
      // Basic image validation - check if it's a valid image
      const imageBuffer = fs.readFileSync(file.path);
      
      if (file.mimetype === 'image/jpeg') {
        try {
          jpeg.decode(imageBuffer);
        } catch (error) {
          result.violations.push({
            type: 'CORRUPTED_IMAGE',
            message: 'Image file appears to be corrupted',
            severity: 'HIGH'
          });
          return;
        }
      }
      
      // Check image dimensions (prevent extremely large images)
      const stats = fs.statSync(file.path);
      if (stats.size > SECURITY_CONFIG.maxFileSizes.image) {
        result.violations.push({
          type: 'IMAGE_TOO_LARGE',
          message: 'Image file size exceeds security limits',
          severity: 'MEDIUM'
        });
        return;
      }
      
      // Enhanced NSFW detection
      const nsfwResult = await nsfwDetectionService.detectNSFW(file.path, 'image');
      result.securityAnalysis.nsfw = nsfwResult;
      
      if (nsfwResult.isNSFW && nsfwResult.confidence > this.securityThresholds.nsfw) {
        result.violations.push({
          type: 'NSFW_CONTENT',
          message: `Image contains inappropriate content (confidence: ${(nsfwResult.confidence * 100).toFixed(1)}%)`,
          severity: 'HIGH',
          details: nsfwResult.predictions,
          method: nsfwResult.method || 'unknown'
        });
        riskFactors.push({ type: 'NSFW content detected', score: nsfwResult.confidence * 0.8 });
        return;
      }
      
      // Keyword analysis on image metadata
      const keywordResult = await keywordFilteringService.analyzeFileContent(file.path, file.mimetype);
      result.securityAnalysis.keywords = keywordResult;
      
      if (keywordResult.isSuspicious && keywordResult.confidence > this.securityThresholds.keyword) {
        const shouldBlock = keywordFilteringService.shouldBlockContent(keywordResult);
        
        if (shouldBlock) {
          result.violations.push({
            type: 'SUSPICIOUS_CONTENT',
            message: 'Suspicious keywords detected in image metadata',
            severity: keywordResult.severity,
            confidence: keywordResult.confidence,
            matches: keywordResult.matches,
            categories: Object.keys(keywordResult.categories)
          });
          riskFactors.push({ type: 'Suspicious keywords detected', score: keywordResult.confidence * 0.7 });
          return;
        }
      }
      
      // Log NSFW detection result
      await securityLoggingService.logNSFWDetection({
        fileName: file.originalname,
        fileType: 'image',
        size: file.size,
        isNSFW: nsfwResult.isNSFW,
        confidence: nsfwResult.confidence,
        method: nsfwResult.method,
        predictions: nsfwResult.predictions,
        requestId: result.requestId
      });
      
      result.securityChecks.contentSafe = true;
      
    } catch (error) {
      result.violations.push({
        type: 'IMAGE_VALIDATION_ERROR',
        message: `Image validation failed: ${error.message}`,
        severity: 'MEDIUM'
      });
    }
  }
  
  // Enhanced video content validation
  async validateVideoContentEnhanced(file, result, riskFactors) {
    try {
      // Basic video validation using ffmpeg
      await new Promise((resolve, reject) => {
        ffmpeg.ffprobe(file.path, (err, metadata) => {
          if (err) {
            result.violations.push({
              type: 'INVALID_VIDEO',
              message: 'Video file appears to be corrupted or invalid',
              severity: 'HIGH'
            });
            reject(err);
            return;
          }
          
          // Check video duration (prevent extremely long videos)
          const duration = metadata.format.duration;
          if (duration > 3600) { // 1 hour limit
            result.violations.push({
              type: 'VIDEO_TOO_LONG',
              message: 'Video duration exceeds security limits (1 hour)',
              severity: 'MEDIUM'
            });
            resolve();
            return;
          }
          
          // Enhanced video analysis
          videoAnalysisService.analyzeVideoNSFW(file.path).then(videoResult => {
            result.securityAnalysis.video = videoResult;
            
            if (videoResult.isNSFW && videoResult.confidence > this.securityThresholds.nsfw) {
              result.violations.push({
                type: 'NSFW_VIDEO',
                message: `Video contains inappropriate content (confidence: ${(videoResult.confidence * 100).toFixed(1)}%)`,
                severity: 'HIGH',
                details: videoResult.details
              });
              riskFactors.push({ type: 'NSFW video content detected', score: videoResult.confidence * 0.9 });
            } else {
              result.securityChecks.contentSafe = true;
            }
            resolve();
          }).catch(err => {
            console.error('Video analysis failed:', err);
            // Fallback to basic NSFW detection
            nsfwDetectionService.detectNSFW(file.path, 'video').then(nsfwResult => {
              if (nsfwResult.isNSFW) {
                result.violations.push({
                  type: 'NSFW_CONTENT',
                  message: `Video contains inappropriate content (confidence: ${(nsfwResult.confidence * 100).toFixed(1)}%)`,
                  severity: 'HIGH',
                  details: nsfwResult.predictions
                });
                riskFactors.push({ type: 'NSFW content detected', score: nsfwResult.confidence * 0.8 });
              } else {
                result.securityChecks.contentSafe = true;
              }
              resolve();
            }).catch(err => {
              console.error('NSFW detection failed for video:', err);
              result.securityChecks.contentSafe = true;
              resolve();
            });
          });
        });
      });
    } catch (error) {
      // Error already handled in the promise
    }
  }
  
  // Enhanced document content validation
  async validateDocumentContentEnhanced(file, result, riskFactors) {
    try {
      if (file.mimetype === 'application/pdf') {
        const dataBuffer = fs.readFileSync(file.path);
        const pdfData = await pdfParse(dataBuffer);
        
        // Enhanced keyword and content analysis
        const keywordResult = await keywordFilteringService.analyzeFileContent(file.path, file.mimetype);
        result.securityAnalysis.keywords = keywordResult;
        
        if (keywordResult.isSuspicious && keywordResult.confidence > this.securityThresholds.keyword) {
          const shouldBlock = keywordFilteringService.shouldBlockContent(keywordResult);
          
          if (shouldBlock) {
            result.violations.push({
              type: 'SUSPICIOUS_CONTENT',
              message: 'Suspicious keywords or content detected in document',
              severity: keywordResult.severity,
              confidence: keywordResult.confidence,
              matches: keywordResult.matches,
              categories: Object.keys(keywordResult.categories)
            });
            riskFactors.push({ type: 'Suspicious keywords detected', score: keywordResult.confidence * 0.7 });
            return;
          }
        }
        
        // Check for prohibited content in text (legacy support)
        const hasProhibitedContent = this.checkProhibitedContent(pdfData.text);
        if (hasProhibitedContent.length > 0) {
          result.violations.push({
            type: 'PROHIBITED_CONTENT',
            message: `Document contains prohibited content: ${hasProhibitedContent.join(', ')}`,
            severity: 'HIGH'
          });
          riskFactors.push({ type: 'Prohibited content detected', score: 0.8 });
          return;
        }
        
        // NSFW detection for text content
        const nsfwResult = await nsfwDetectionService.detectNSFW(pdfData.text, 'text');
        if (nsfwResult.isNSFW) {
          result.violations.push({
            type: 'NSFW_CONTENT',
            message: `Document contains inappropriate text content (confidence: ${(nsfwResult.confidence * 100).toFixed(1)}%)`,
            severity: 'HIGH',
            details: nsfwResult.predictions
          });
          riskFactors.push({ type: 'NSFW text content detected', score: nsfwResult.confidence * 0.7 });
          return;
        }
      }
      
      result.securityChecks.contentSafe = true;
    } catch (error) {
      result.violations.push({
        type: 'DOCUMENT_VALIDATION_ERROR',
        message: `Document validation failed: ${error.message}`,
        severity: 'MEDIUM'
      });
    }
  }
  
  // Audio content validation
  async validateAudioContent(file, result) {
    try {
      // Basic audio validation using ffmpeg
      await new Promise((resolve, reject) => {
        ffmpeg.ffprobe(file.path, (err, metadata) => {
          if (err) {
            result.violations.push({
              type: 'INVALID_AUDIO',
              message: 'Audio file appears to be corrupted or invalid',
              severity: 'HIGH'
            });
            reject(err);
            return;
          }
          
          // Check audio duration
          const duration = metadata.format.duration;
          if (duration > 7200) { // 2 hours limit
            result.violations.push({
              type: 'AUDIO_TOO_LONG',
              message: 'Audio duration exceeds security limits (2 hours)',
              severity: 'MEDIUM'
            });
          }
          
          result.securityChecks.contentSafe = true;
          resolve();
        });
      });
    } catch (error) {
      // Error already handled in the promise
    }
  }
  
  // Basic malware detection
  async validateMalware(file, result) {
    try {
      // Check for suspicious file signatures
      const buffer = fs.readFileSync(file.path, { start: 0, end: 1024 });
      const fileSignature = buffer.toString('hex');
      
      // Check for executable signatures
      const executableSignatures = [
        '4d5a', // PE executable
        '7f454c46', // ELF executable
        'cafebabe', // Java class file
        'feedface', // Mach-O executable
      ];
      
      for (const signature of executableSignatures) {
        if (fileSignature.toLowerCase().startsWith(signature)) {
          result.violations.push({
            type: 'EXECUTABLE_FILE',
            message: 'Executable files are not allowed',
            severity: 'HIGH'
          });
          return;
        }
      }
      
      result.securityChecks.malwareFree = true;
    } catch (error) {
      result.violations.push({
        type: 'MALWARE_SCAN_ERROR',
        message: `Malware scan failed: ${error.message}`,
        severity: 'MEDIUM'
      });
    }
  }
  
  // File integrity validation
  async validateFileIntegrity(file, result) {
    try {
      // Calculate file hash for integrity
      const fileBuffer = fs.readFileSync(file.path);
      const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
      
      result.fileInfo.hash = hash;
      
      // Check if file is empty
      if (file.size === 0) {
        result.violations.push({
          type: 'EMPTY_FILE',
          message: 'Empty files are not allowed',
          severity: 'MEDIUM'
        });
        return;
      }
      
    } catch (error) {
      result.violations.push({
        type: 'INTEGRITY_CHECK_ERROR',
        message: `File integrity check failed: ${error.message}`,
        severity: 'MEDIUM'
      });
    }
  }
  
  // Helper methods
  getFileCategory(mimeType) {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('text')) return 'document';
    return null;
  }
  
  checkProhibitedContent(text) {
    const violations = [];
    
    for (const pattern of SECURITY_CONFIG.prohibitedPatterns) {
      const matches = text.match(pattern);
      if (matches) {
        violations.push(...matches);
      }
    }
    
    return [...new Set(violations)]; // Remove duplicates
  }
  
  calculateRiskLevel(riskScore) {
    if (riskScore >= 0.8) return 'critical';
    if (riskScore >= 0.6) return 'high';
    if (riskScore >= 0.4) return 'medium';
    if (riskScore >= 0.2) return 'low';
    return 'minimal';
  }
  
  getSeverityLevel(violations) {
    const highSeverityTypes = ['NSFW_CONTENT', 'EXECUTABLE_FILE', 'PROHIBITED_CONTENT', 'HIGH_RISK_CONTENT'];
    const hasHighSeverity = violations.some(v => highSeverityTypes.includes(v.type));
    return hasHighSeverity ? 'HIGH' : 'MEDIUM';
  }
}

// Middleware function
const fileSecurityValidator = new FileSecurityValidator();

const validateFileSecurityMiddleware = async (req, res, next) => {
  try {
    // Check if files are present
    if (!req.file && !req.files) {
      return next();
    }
    
    const files = req.files || [req.file];
    const validationResults = [];
    
    // Validate each file
    for (const file of files) {
      if (file) {
        const result = await fileSecurityValidator.validateFile(file, {
          userId: req.user?.id,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          method: req.method,
          url: req.originalUrl
        });
        validationResults.push(result);
        
        // If any file fails validation, reject the request
        if (!result.isValid) {
          // Log security violation
          console.error('File security violation:', {
            file: file.originalname,
            violations: result.violations,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            timestamp: new Date().toISOString()
          });
          
          // Clean up uploaded file
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
          
          return res.status(400).json({
            success: false,
            message: 'File security validation failed',
            violations: result.violations,
            code: 'SECURITY_VIOLATION'
          });
        }
      }
    }
    
    // Attach validation results to request
    req.fileValidationResults = validationResults;
    
    next();
  } catch (error) {
    console.error('File security validation error:', error);
    return res.status(500).json({
      success: false,
      message: 'File security validation failed',
      error: error.message
    });
  }
};

module.exports = {
  validateFileSecurityMiddleware,
  FileSecurityValidator,
  SECURITY_CONFIG
};