const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const crypto = require('crypto');
const nsfw = require('nsfwjs');
const tf = require('@tensorflow/tfjs');
const jpeg = require('jpeg-js');

// NSFW Detection Service
class NSFWDetectionService {
  constructor() {
    this.isModelLoaded = false;
    this.nsfwModel = null;
    this.initializeModel();
    
    // NSFW thresholds
    this.thresholds = {
      porn: 0.8,
      hentai: 0.8,
      sexy: 0.7
    };
  }
  
  async initializeModel() {
    try {
      console.log('Loading NSFW detection model...');
      this.nsfwModel = await nsfw.load();
      this.isModelLoaded = true;
      console.log('NSFW model loaded successfully ✅');
    } catch (error) {
      console.error('Failed to initialize NSFW model:', error);
      this.isModelLoaded = false;
    }
  }
  
  // Main NSFW detection function
  async detectNSFW(filePath, fileType) {
    const result = {
      isNSFW: false,
      confidence: 0,
      predictions: {},
      method: 'heuristic',
      timestamp: new Date().toISOString()
    };
    
    try {
      switch (fileType) {
        case 'image':
          return await this.detectImageNSFW(filePath, result);
        case 'video':
          return await this.detectVideoNSFW(filePath, result);
        case 'text':
          return await this.detectTextNSFW(filePath, result);
        default:
          result.method = 'unsupported';
          return result;
      }
    } catch (error) {
      console.error('NSFW detection error:', error);
      result.error = error.message;
      return result;
    }
  }
  
  // Image NSFW detection
  async detectImageNSFW(imagePath, result) {
    try {
      // Use ML-based detection if model is loaded
      if (this.isModelLoaded && this.nsfwModel) {
        return await this.detectImageNSFWWithML(imagePath, result);
      }
      
      // Fallback to heuristic-based image analysis
      const stats = fs.statSync(imagePath);
      const fileBuffer = fs.readFileSync(imagePath);
      
      // Check file size patterns (very large images might be suspicious)
      if (stats.size > 5 * 1024 * 1024) { // 5MB
        result.confidence += 0.1;
      }
      
      // Check for suspicious filename patterns
      const filename = path.basename(imagePath).toLowerCase();
      const suspiciousKeywords = [
        'nude', 'naked', 'sex', 'porn', 'xxx', 'adult', 'nsfw',
        'erotic', 'sexy', 'hot', 'bikini', 'lingerie'
      ];
      
      for (const keyword of suspiciousKeywords) {
        if (filename.includes(keyword)) {
          result.confidence += 0.3;
          result.predictions[keyword] = 0.8;
        }
      }
      
      // Basic image metadata analysis
      const imageHash = crypto.createHash('md5').update(fileBuffer).digest('hex');
      
      // Check against known NSFW image hashes (placeholder)
      const knownNSFWHashes = [
        // Add known NSFW image hashes here
      ];
      
      if (knownNSFWHashes.includes(imageHash)) {
        result.confidence = 0.9;
        result.predictions.knownNSFW = 0.9;
      }
      
      // Determine if NSFW based on confidence threshold
      result.isNSFW = result.confidence > 0.5;
      result.method = 'heuristic-fallback';
      
      return result;
    } catch (error) {
      result.error = error.message;
      return result;
    }
  }
  
  // ML-based Image NSFW detection
  async detectImageNSFWWithML(imagePath, result) {
    try {
      const fileBuffer = fs.readFileSync(imagePath);
      
      // Convert image to tensor
      const tensor = await this.imageToTensor(imagePath, fileBuffer);
      if (!tensor) {
        // Fallback to heuristic if tensor conversion fails
        result.method = 'heuristic-fallback';
        return await this.detectImageNSFWHeuristic(imagePath, result);
      }
      
      // Get predictions from NSFW model
      const predictions = await this.nsfwModel.classify(tensor);
      tensor.dispose(); // Clean up memory
      
      // Analyze predictions
      const analysis = this.analyzePredictions(predictions);
      
      result.confidence = analysis.confidence;
      result.isNSFW = analysis.isNSFW;
      result.predictions = predictions;
      result.method = 'ml-based';
      result.reasons = analysis.reasons;
      
      return result;
    } catch (error) {
      console.error('ML image analysis failed:', error);
      result.error = error.message;
      result.method = 'heuristic-fallback';
      return await this.detectImageNSFWHeuristic(imagePath, result);
    }
  }
  
  // Helper method to convert image to tensor
  async imageToTensor(imagePath, fileBuffer) {
    try {
      const ext = path.extname(imagePath).toLowerCase();
      
      if (ext === '.jpg' || ext === '.jpeg') {
        const pixels = jpeg.decode(fileBuffer, true);
        return tf.browser.fromPixels({
          data: pixels.data,
          width: pixels.width,
          height: pixels.height
        });
      } else if (tf.node) {
        return tf.node.decodeImage(fileBuffer, 3);
      }
      
      return null;
    } catch (error) {
      console.error('Failed to convert image to tensor:', error);
      return null;
    }
  }
  
  // Analyze ML predictions
  analyzePredictions(predictions) {
    const reasons = [];
    let maxConfidence = 0;
    let isNSFW = false;
    
    for (const prediction of predictions) {
      const { className, probability } = prediction;
      
      if (className === 'Porn' && probability > this.thresholds.porn) {
        isNSFW = true;
        maxConfidence = Math.max(maxConfidence, probability);
        reasons.push(`Pornographic content detected (${(probability * 100).toFixed(1)}%)`);
      }
      
      if (className === 'Hentai' && probability > this.thresholds.hentai) {
        isNSFW = true;
        maxConfidence = Math.max(maxConfidence, probability);
        reasons.push(`Hentai content detected (${(probability * 100).toFixed(1)}%)`);
      }
      
      if (className === 'Sexy' && probability > this.thresholds.sexy) {
        isNSFW = true;
        maxConfidence = Math.max(maxConfidence, probability);
        reasons.push(`Sexually suggestive content detected (${(probability * 100).toFixed(1)}%)`);
      }
    }
    
    return {
      isNSFW,
      confidence: maxConfidence,
      reasons: reasons.length > 0 ? reasons : ['Content appears safe']
    };
  }
  
  // Heuristic fallback method
  async detectImageNSFWHeuristic(imagePath, result) {
    const stats = fs.statSync(imagePath);
    const fileBuffer = fs.readFileSync(imagePath);
    
    // Check file size patterns
    if (stats.size > 5 * 1024 * 1024) {
      result.confidence += 0.1;
    }
    
    // Check filename patterns
    const filename = path.basename(imagePath).toLowerCase();
    const suspiciousKeywords = [
      'nude', 'naked', 'sex', 'porn', 'xxx', 'adult', 'nsfw',
      'erotic', 'sexy', 'hot', 'bikini', 'lingerie'
    ];
    
    for (const keyword of suspiciousKeywords) {
      if (filename.includes(keyword)) {
        result.confidence += 0.3;
        result.predictions[keyword] = 0.8;
      }
    }
    
    result.isNSFW = result.confidence > 0.5;
    return result;
  }
  
  // Video NSFW detection
  async detectVideoNSFW(videoPath, result) {
    try {
      // Extract frames from video for analysis
      const tempDir = path.join(__dirname, '../temp/frames');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      const framePromises = [];
      
      // Extract 5 frames at different intervals
      for (let i = 1; i <= 5; i++) {
        const framePath = path.join(tempDir, `frame_${Date.now()}_${i}.jpg`);
        
        const framePromise = new Promise((resolve, reject) => {
          ffmpeg(videoPath)
            .seekInput(i * 10) // Seek to different positions
            .frames(1)
            .output(framePath)
            .on('end', () => resolve(framePath))
            .on('error', reject)
            .run();
        });
        
        framePromises.push(framePromise);
      }
      
      try {
        const framePaths = await Promise.all(framePromises);
        
        // Analyze each extracted frame
        let totalConfidence = 0;
        let frameCount = 0;
        
        for (const framePath of framePaths) {
          if (fs.existsSync(framePath)) {
            const frameResult = await this.detectImageNSFW(framePath, {
              isNSFW: false,
              confidence: 0,
              predictions: {},
              method: 'heuristic'
            });
            
            totalConfidence += frameResult.confidence;
            frameCount++;
            
            // Clean up frame
            fs.unlinkSync(framePath);
          }
        }
        
        // Average confidence across frames
        result.confidence = frameCount > 0 ? totalConfidence / frameCount : 0;
        result.isNSFW = result.confidence > 0.5;
        result.framesAnalyzed = frameCount;
        
      } catch (frameError) {
        console.error('Frame extraction error:', frameError);
        result.error = 'Failed to extract video frames';
      }
      
      return result;
    } catch (error) {
      result.error = error.message;
      return result;
    }
  }
  
  // Text NSFW detection
  async detectTextNSFW(textContent, result) {
    try {
      const text = typeof textContent === 'string' ? textContent : fs.readFileSync(textContent, 'utf8');
      
      // Define NSFW keywords and patterns
      const nsfwKeywords = [
        'sex', 'porn', 'nude', 'naked', 'xxx', 'adult', 'erotic',
        'orgasm', 'masturbate', 'penis', 'vagina', 'breast', 'nipple',
        'fuck', 'shit', 'bitch', 'ass', 'cock', 'pussy', 'dick'
      ];
      
      const explicitPatterns = [
        /\b(sex|porn|nude|naked)\b/gi,
        /\b(fuck|shit|damn|bitch)\b/gi,
        /\b(penis|vagina|breast|nipple)\b/gi
      ];
      
      let matchCount = 0;
      const foundKeywords = [];
      
      // Check for explicit keywords
      for (const keyword of nsfwKeywords) {
        const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
        const matches = text.match(regex);
        if (matches) {
          matchCount += matches.length;
          foundKeywords.push(keyword);
        }
      }
      
      // Check for explicit patterns
      for (const pattern of explicitPatterns) {
        const matches = text.match(pattern);
        if (matches) {
          matchCount += matches.length * 2; // Weight pattern matches higher
        }
      }
      
      // Calculate confidence based on match density
      const wordCount = text.split(/\s+/).length;
      const matchDensity = wordCount > 0 ? matchCount / wordCount : 0;
      
      result.confidence = Math.min(matchDensity * 10, 1); // Cap at 1.0
      result.isNSFW = result.confidence > 0.1;
      result.predictions = {
        explicitKeywords: foundKeywords,
        matchCount,
        wordCount,
        matchDensity
      };
      
      return result;
    } catch (error) {
      result.error = error.message;
      return result;
    }
  }
  
  // Batch NSFW detection for multiple files
  async batchDetectNSFW(files) {
    const results = [];
    
    for (const file of files) {
      try {
        const fileType = this.getFileType(file.mimetype);
        const result = await this.detectNSFW(file.path, fileType);
        result.fileName = file.originalname;
        result.fileSize = file.size;
        results.push(result);
      } catch (error) {
        results.push({
          fileName: file.originalname,
          error: error.message,
          isNSFW: false,
          confidence: 0
        });
      }
    }
    
    return results;
  }
  
  // Helper method to determine file type
  getFileType(mimeType) {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('text/') || mimeType.includes('pdf') || mimeType.includes('document')) return 'text';
    return 'unknown';
  }
  
  // Update NSFW thresholds
  updateThresholds(newThresholds) {
    this.thresholds = { ...this.thresholds, ...newThresholds };
  }
  
  // Get detection statistics
  getDetectionStats() {
    return {
      modelLoaded: this.isModelLoaded,
      method: this.isModelLoaded ? 'ml' : 'heuristic',
      supportedTypes: ['image', 'video', 'text']
    };
  }
}

// Export singleton instance
const nsfwDetectionService = new NSFWDetectionService();

module.exports = {
  nsfwDetectionService,
  NSFWDetectionService
};