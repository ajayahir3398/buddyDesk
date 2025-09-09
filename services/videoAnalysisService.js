const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const { promisify } = require('util');
const { exec } = require('child_process');
const execAsync = promisify(exec);

class VideoAnalysisService {
  constructor(nsfwDetectionService) {
    this.nsfwDetectionService = nsfwDetectionService;
    this.tempDir = path.join(__dirname, '../temp/video-frames');
    this.ensureTempDir();
    
    // Configuration
    this.config = {
      frameInterval: 5, // Extract 1 frame every 5 seconds
      maxFrames: 20,    // Maximum frames to analyze
      frameFormat: 'jpg',
      frameQuality: 2   // 1-31, lower is better quality
    };
  }

  // Ensure temp directory exists
  ensureTempDir() {
    try {
      if (!fs.existsSync(this.tempDir)) {
        fs.mkdirSync(this.tempDir, { recursive: true });
      }
    } catch (error) {
      console.error('Failed to create temp directory:', error);
    }
  }

  // Get video metadata
  async getVideoMetadata(videoPath) {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(videoPath, (err, metadata) => {
        if (err) {
          reject(err);
        } else {
          resolve(metadata);
        }
      });
    });
  }

  // Extract frames from video
  async extractFrames(videoPath, outputDir) {
    try {
      const metadata = await this.getVideoMetadata(videoPath);
      const duration = metadata.format.duration;
      
      if (!duration || duration <= 0) {
        throw new Error('Invalid video duration');
      }

      // Calculate frame extraction points
      const frameCount = Math.min(
        Math.floor(duration / this.config.frameInterval),
        this.config.maxFrames
      );

      const framePromises = [];
      const extractedFrames = [];

      for (let i = 0; i < frameCount; i++) {
        const timestamp = i * this.config.frameInterval;
        const framePath = path.join(outputDir, `frame_${i}_${timestamp}s.${this.config.frameFormat}`);
        
        const promise = this.extractSingleFrame(videoPath, timestamp, framePath)
          .then(() => {
            extractedFrames.push({
              path: framePath,
              timestamp: timestamp,
              index: i
            });
          })
          .catch(error => {
            console.error(`Failed to extract frame at ${timestamp}s:`, error);
          });
        
        framePromises.push(promise);
      }

      await Promise.all(framePromises);
      
      return {
        success: true,
        frames: extractedFrames,
        totalFrames: frameCount,
        videoDuration: duration
      };
    } catch (error) {
      console.error('Frame extraction failed:', error);
      return {
        success: false,
        error: error.message,
        frames: []
      };
    }
  }

  // Extract a single frame at specific timestamp
  async extractSingleFrame(videoPath, timestamp, outputPath) {
    return new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .seekInput(timestamp)
        .frames(1)
        .output(outputPath)
        .outputOptions([
          '-q:v', this.config.frameQuality.toString(),
          '-update', '1'
        ])
        .on('end', () => resolve(outputPath))
        .on('error', reject)
        .run();
    });
  }

  // Analyze video for NSFW content
  async analyzeVideoNSFW(videoPath) {
    const sessionId = Date.now().toString();
    const sessionDir = path.join(this.tempDir, sessionId);
    
    try {
      // Create session directory
      fs.mkdirSync(sessionDir, { recursive: true });
      
      // Extract frames
      const extractionResult = await this.extractFrames(videoPath, sessionDir);
      
      if (!extractionResult.success || extractionResult.frames.length === 0) {
        return {
          isNSFW: false,
          confidence: 0,
          error: 'Failed to extract frames for analysis',
          method: 'video-frame-analysis'
        };
      }

      // Analyze each frame for NSFW content
      const frameAnalyses = [];
      let maxConfidence = 0;
      let nsfwFrameCount = 0;
      const nsfwFrames = [];

      for (const frame of extractionResult.frames) {
        try {
          if (fs.existsSync(frame.path)) {
            const frameBuffer = fs.readFileSync(frame.path);
            const analysis = await this.nsfwDetectionService.detectNSFWContent(
              frame.path,
              frameBuffer,
              'image/jpeg'
            );
            
            frameAnalyses.push({
              ...frame,
              analysis: analysis,
              isNSFW: analysis.isNSFW,
              confidence: analysis.confidence
            });

            if (analysis.isNSFW) {
              nsfwFrameCount++;
              nsfwFrames.push(frame);
              maxConfidence = Math.max(maxConfidence, analysis.confidence);
            }
          }
        } catch (error) {
          console.error(`Failed to analyze frame ${frame.index}:`, error);
        }
      }

      // Calculate overall video NSFW score
      const nsfwPercentage = nsfwFrameCount / extractionResult.frames.length;
      const overallConfidence = Math.min(1.0, maxConfidence * (1 + nsfwPercentage));
      
      // Video is considered NSFW if:
      // 1. More than 20% of frames are NSFW, OR
      // 2. Any frame has very high confidence (>0.9), OR
      // 3. Multiple consecutive frames are NSFW
      const isNSFW = nsfwPercentage > 0.2 || maxConfidence > 0.9 || this.hasConsecutiveNSFWFrames(frameAnalyses);

      const result = {
        isNSFW,
        confidence: overallConfidence,
        method: 'video-frame-analysis',
        details: {
          totalFrames: extractionResult.frames.length,
          nsfwFrames: nsfwFrameCount,
          nsfwPercentage: nsfwPercentage,
          maxFrameConfidence: maxConfidence,
          videoDuration: extractionResult.videoDuration,
          frameInterval: this.config.frameInterval
        },
        frameAnalyses: frameAnalyses.map(f => ({
          timestamp: f.timestamp,
          isNSFW: f.isNSFW,
          confidence: f.confidence,
          reasons: f.analysis.reasons
        }))
      };

      return result;
    } catch (error) {
      console.error('Video NSFW analysis failed:', error);
      return {
        isNSFW: false,
        confidence: 0,
        error: error.message,
        method: 'video-frame-analysis'
      };
    } finally {
      // Cleanup session directory
      this.cleanupSessionDir(sessionDir);
    }
  }

  // Check for consecutive NSFW frames (indicates sustained inappropriate content)
  hasConsecutiveNSFWFrames(frameAnalyses, threshold = 3) {
    let consecutiveCount = 0;
    
    for (const frame of frameAnalyses) {
      if (frame.isNSFW) {
        consecutiveCount++;
        if (consecutiveCount >= threshold) {
          return true;
        }
      } else {
        consecutiveCount = 0;
      }
    }
    
    return false;
  }

  // Get video file information
  async getVideoInfo(videoPath) {
    try {
      const metadata = await this.getVideoMetadata(videoPath);
      const stats = fs.statSync(videoPath);
      
      return {
        duration: metadata.format.duration,
        size: stats.size,
        format: metadata.format.format_name,
        bitRate: metadata.format.bit_rate,
        streams: metadata.streams.map(stream => ({
          type: stream.codec_type,
          codec: stream.codec_name,
          width: stream.width,
          height: stream.height,
          frameRate: stream.r_frame_rate
        }))
      };
    } catch (error) {
      console.error('Failed to get video info:', error);
      return null;
    }
  }

  // Analyze video filename and metadata for suspicious patterns
  analyzeVideoMetadata(videoPath, metadata) {
    const filename = path.basename(videoPath).toLowerCase();
    const suspiciousKeywords = [
      'nude', 'naked', 'sex', 'porn', 'xxx', 'adult', 'nsfw',
      'erotic', 'sexy', 'hot', 'strip', 'cam', 'webcam'
    ];
    
    let suspicionScore = 0;
    const reasons = [];
    
    // Check filename
    for (const keyword of suspiciousKeywords) {
      if (filename.includes(keyword)) {
        suspicionScore += 0.4;
        reasons.push(`Suspicious keyword in filename: ${keyword}`);
      }
    }
    
    // Check video duration (very short or very long videos might be suspicious)
    if (metadata && metadata.format.duration) {
      const duration = metadata.format.duration;
      if (duration < 10) {
        suspicionScore += 0.1;
        reasons.push('Very short video duration');
      } else if (duration > 3600) { // 1 hour
        suspicionScore += 0.1;
        reasons.push('Very long video duration');
      }
    }
    
    // Check file size patterns
    const stats = fs.statSync(videoPath);
    if (stats.size > 100 * 1024 * 1024) { // 100MB
      suspicionScore += 0.1;
      reasons.push('Large file size');
    }
    
    return {
      isSuspicious: suspicionScore > 0.3,
      confidence: Math.min(1.0, suspicionScore),
      reasons,
      method: 'metadata-analysis'
    };
  }

  // Cleanup session directory
  cleanupSessionDir(sessionDir) {
    try {
      if (fs.existsSync(sessionDir)) {
        const files = fs.readdirSync(sessionDir);
        for (const file of files) {
          fs.unlinkSync(path.join(sessionDir, file));
        }
        fs.rmdirSync(sessionDir);
      }
    } catch (error) {
      console.error('Failed to cleanup session directory:', error);
    }
  }

  // Cleanup old temp directories
  cleanupOldSessions(maxAge = 3600000) { // 1 hour
    try {
      if (!fs.existsSync(this.tempDir)) return;
      
      const sessions = fs.readdirSync(this.tempDir);
      const now = Date.now();
      
      for (const session of sessions) {
        const sessionPath = path.join(this.tempDir, session);
        const stats = fs.statSync(sessionPath);
        
        if (now - stats.mtime.getTime() > maxAge) {
          this.cleanupSessionDir(sessionPath);
        }
      }
    } catch (error) {
      console.error('Failed to cleanup old sessions:', error);
    }
  }
}

module.exports = VideoAnalysisService;