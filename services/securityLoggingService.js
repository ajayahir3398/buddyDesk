const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Security Logging Service
class SecurityLoggingService {
  constructor() {
    this.logDir = path.join(__dirname, '../logs/security');
    this.ensureLogDirectory();
  }

  // Ensure log directory exists
  ensureLogDirectory() {
    try {
      if (!fs.existsSync(this.logDir)) {
        fs.mkdirSync(this.logDir, { recursive: true });
      }
    } catch (error) {
      console.error('Failed to create security log directory:', error);
    }
  }

  // Log security violation
  async logSecurityViolation(violationData) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      type: 'SECURITY_VIOLATION',
      severity: violationData.severity || 'MEDIUM',
      violationType: violationData.type,
      message: violationData.message,
      fileInfo: violationData.fileInfo || {},
      userInfo: {
        userId: violationData.userId,
        ip: violationData.ip,
        userAgent: violationData.userAgent
      },
      requestInfo: {
        method: violationData.method,
        url: violationData.url,
        headers: violationData.headers
      },
      violations: violationData.violations || [],
      actionTaken: violationData.actionTaken || 'FILE_REJECTED',
      sessionId: violationData.sessionId,
      requestId: violationData.requestId
    };

    try {
      // Write to daily log file
      const logFileName = `security-${new Date().toISOString().split('T')[0]}.log`;
      const logFilePath = path.join(this.logDir, logFileName);

      const logLine = JSON.stringify(logEntry) + '\n';
      fs.appendFileSync(logFilePath, logLine);

      // Also log to console for immediate visibility
      console.error('SECURITY VIOLATION:', logEntry);

      // Check if this is a high-severity violation that needs immediate attention
      if (violationData.severity === 'HIGH' || violationData.severity === 'CRITICAL') {
        await this.handleHighSeverityViolation(logEntry);
      }

    } catch (error) {
      console.error('Failed to log security violation:', error);
    }
  }

  // Log file upload attempt
  async logFileUpload(uploadData) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      type: 'FILE_UPLOAD',
      status: uploadData.status, // 'SUCCESS', 'REJECTED', 'ERROR'
      fileInfo: {
        originalName: uploadData.originalName,
        mimeType: uploadData.mimeType,
        size: uploadData.size,
        hash: uploadData.hash,
        path: uploadData.path
      },
      userInfo: {
        userId: uploadData.userId,
        ip: uploadData.ip,
        userAgent: uploadData.userAgent
      },
      validationResults: uploadData.validationResults || {},
      processingTime: uploadData.processingTime,
      requestId: uploadData.requestId
    };

    try {
      const logFileName = `uploads-${new Date().toISOString().split('T')[0]}.log`;
      const logFilePath = path.join(this.logDir, logFileName);

      const logLine = JSON.stringify(logEntry) + '\n';
      fs.appendFileSync(logFilePath, logLine);

    } catch (error) {
      console.error('Failed to log file upload:', error);
    }
  }

  // Log NSFW detection results
  async logNSFWDetection(nsfwData) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      type: 'NSFW_DETECTION',
      fileInfo: {
        fileName: nsfwData.fileName,
        fileType: nsfwData.fileType,
        size: nsfwData.size
      },
      detectionResults: {
        isNSFW: nsfwData.isNSFW,
        confidence: nsfwData.confidence,
        method: nsfwData.method,
        predictions: nsfwData.predictions
      },
      userInfo: {
        userId: nsfwData.userId,
        ip: nsfwData.ip
      },
      actionTaken: nsfwData.isNSFW ? 'FILE_REJECTED' : 'FILE_APPROVED',
      requestId: nsfwData.requestId
    };

    try {
      const logFileName = `nsfw-detection-${new Date().toISOString().split('T')[0]}.log`;
      const logFilePath = path.join(this.logDir, logFileName);

      const logLine = JSON.stringify(logEntry) + '\n';
      fs.appendFileSync(logFilePath, logLine);

    } catch (error) {
      console.error('Failed to log NSFW detection:', error);
    }
  }

  // Log malware detection attempts
  async logMalwareDetection(malwareData) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      type: 'MALWARE_DETECTION',
      severity: 'HIGH',
      fileInfo: {
        fileName: malwareData.fileName,
        mimeType: malwareData.mimeType,
        size: malwareData.size,
        hash: malwareData.hash,
        signature: malwareData.signature
      },
      detectionResults: {
        isMalware: malwareData.isMalware,
        detectionMethod: malwareData.method,
        threats: malwareData.threats || []
      },
      userInfo: {
        userId: malwareData.userId,
        ip: malwareData.ip,
        userAgent: malwareData.userAgent
      },
      actionTaken: 'FILE_QUARANTINED',
      requestId: malwareData.requestId
    };

    try {
      const logFileName = `malware-detection-${new Date().toISOString().split('T')[0]}.log`;
      const logFilePath = path.join(this.logDir, logFileName);

      const logLine = JSON.stringify(logEntry) + '\n';
      fs.appendFileSync(logFilePath, logLine);

      // High severity - also log to main security log
      await this.logSecurityViolation({
        type: 'MALWARE_DETECTED',
        severity: 'CRITICAL',
        message: `Malware detected in file: ${malwareData.fileName}`,
        fileInfo: malwareData,
        userId: malwareData.userId,
        ip: malwareData.ip,
        userAgent: malwareData.userAgent,
        violations: [{ type: 'MALWARE', details: malwareData.threats }],
        actionTaken: 'FILE_QUARANTINED'
      });

    } catch (error) {
      console.error('Failed to log malware detection:', error);
    }
  }

  // Handle high severity violations
  async handleHighSeverityViolation(logEntry) {
    try {
      // Write to critical alerts log
      const alertFileName = `critical-alerts-${new Date().toISOString().split('T')[0]}.log`;
      const alertFilePath = path.join(this.logDir, alertFileName);

      const alertEntry = {
        ...logEntry,
        alertLevel: 'CRITICAL',
        requiresImmediateAttention: true
      };

      const alertLine = JSON.stringify(alertEntry) + '\n';
      fs.appendFileSync(alertFilePath, alertLine);

      // TODO: Implement additional alerting mechanisms
      // - Send email notifications
      // - Send Slack/Teams notifications
      // - Trigger security incident response

    } catch (error) {
      console.error('Failed to handle high severity violation:', error);
    }
  }

  // Get security statistics
  async getSecurityStats(dateRange = 7) {
    try {
      const stats = {
        totalViolations: 0,
        violationsByType: {},
        violationsBySeverity: {},
        nsfwDetections: 0,
        malwareDetections: 0,
        fileUploads: {
          total: 0,
          successful: 0,
          rejected: 0
        },
        topViolatingIPs: {},
        dateRange: dateRange
      };

      // Read log files for the specified date range
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - (dateRange * 24 * 60 * 60 * 1000));

      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];

        // Process security violations
        const securityLogPath = path.join(this.logDir, `security-${dateStr}.log`);
        if (fs.existsSync(securityLogPath)) {
          const logContent = fs.readFileSync(securityLogPath, 'utf8');
          const lines = logContent.trim().split('\n').filter(line => line);

          for (const line of lines) {
            try {
              const entry = JSON.parse(line);
              stats.totalViolations++;

              // Count by type
              stats.violationsByType[entry.violationType] =
                (stats.violationsByType[entry.violationType] || 0) + 1;

              // Count by severity
              stats.violationsBySeverity[entry.severity] =
                (stats.violationsBySeverity[entry.severity] || 0) + 1;

              // Track violating IPs
              const ip = entry.userInfo?.ip;
              if (ip) {
                stats.topViolatingIPs[ip] = (stats.topViolatingIPs[ip] || 0) + 1;
              }
            } catch (parseError) {
              // Skip malformed log entries
            }
          }
        }

        // Process NSFW detections
        const nsfwLogPath = path.join(this.logDir, `nsfw-detection-${dateStr}.log`);
        if (fs.existsSync(nsfwLogPath)) {
          const logContent = fs.readFileSync(nsfwLogPath, 'utf8');
          const lines = logContent.trim().split('\n').filter(line => line);

          for (const line of lines) {
            try {
              const entry = JSON.parse(line);
              if (entry.detectionResults?.isNSFW) {
                stats.nsfwDetections++;
              }
            } catch (parseError) {
              // Skip malformed log entries
            }
          }
        }

        // Process file uploads
        const uploadsLogPath = path.join(this.logDir, `uploads-${dateStr}.log`);
        if (fs.existsSync(uploadsLogPath)) {
          const logContent = fs.readFileSync(uploadsLogPath, 'utf8');
          const lines = logContent.trim().split('\n').filter(line => line);

          for (const line of lines) {
            try {
              const entry = JSON.parse(line);
              stats.fileUploads.total++;

              if (entry.status === 'SUCCESS') {
                stats.fileUploads.successful++;
              } else if (entry.status === 'REJECTED') {
                stats.fileUploads.rejected++;
              }
            } catch (parseError) {
              // Skip malformed log entries
            }
          }
        }
      }

      return stats;
    } catch (error) {
      console.error('Failed to get security stats:', error);
      return null;
    }
  }

  // Clean old log files
  async cleanOldLogs(retentionDays = 30) {
    try {
      const cutoffDate = new Date(Date.now() - (retentionDays * 24 * 60 * 60 * 1000));
      const files = fs.readdirSync(this.logDir);

      for (const file of files) {
        const filePath = path.join(this.logDir, file);
        const stats = fs.statSync(filePath);

        if (stats.mtime < cutoffDate) {
          fs.unlinkSync(filePath);
          console.log(`Cleaned old security log: ${file}`);
        }
      }
    } catch (error) {
      console.error('Failed to clean old logs:', error);
    }
  }
}

// Export singleton instance
const securityLoggingService = new SecurityLoggingService();

module.exports = {
  securityLoggingService
};