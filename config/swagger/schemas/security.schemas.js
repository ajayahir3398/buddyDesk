/**
 * Security-related Swagger Schemas
 * Contains all schemas related to file security validation, NSFW detection, and content analysis
 */

module.exports = {
  FileSecurityValidationResult: {
    type: "object",
    properties: {
      isValid: {
        type: "boolean",
        example: true,
        description: "Whether the file passed security validation",
      },
      violations: {
        type: "array",
        items: {
          $ref: "#/components/schemas/SecurityViolation",
        },
        description: "List of security violations found",
      },
      warnings: {
        type: "array",
        items: {
          $ref: "#/components/schemas/SecurityWarning",
        },
        description: "List of security warnings",
      },
      details: {
        $ref: "#/components/schemas/SecurityAnalysisDetails",
        description: "Detailed security analysis results",
      },
    },
  },
  SecurityViolation: {
    type: "object",
    properties: {
      type: {
        type: "string",
        enum: [
          "nsfw_content",
          "nsfw_video",
          "suspicious_content",
          "high_risk_content",
          "malware_detected",
          "file_size_exceeded",
          "invalid_file_type",
        ],
        description: "Type of security violation",
      },
      severity: {
        type: "string",
        enum: ["low", "medium", "high", "critical"],
        description: "Severity level of the violation",
      },
      message: {
        type: "string",
        example: "Inappropriate content detected",
        description: "Human-readable violation message",
      },
      confidence: {
        type: "number",
        minimum: 0,
        maximum: 1,
        example: 0.85,
        description: "Confidence score of the detection (0-1)",
      },
      details: {
        type: "object",
        description: "Additional violation-specific details",
      },
    },
  },
  SecurityWarning: {
    type: "object",
    properties: {
      type: {
        type: "string",
        example: "file_integrity",
        description: "Type of security warning",
      },
      message: {
        type: "string",
        example: "File integrity could not be verified",
        description: "Warning message",
      },
    },
  },
  SecurityAnalysisDetails: {
    type: "object",
    properties: {
      requestId: {
        type: "string",
        example: "550e8400-e29b-41d4-a716-446655440000",
        description: "Unique request identifier",
      },
      timestamp: {
        type: "string",
        format: "date-time",
        example: "2024-01-01T12:00:00.000Z",
        description: "Analysis timestamp",
      },
      processingTime: {
        type: "number",
        example: 1250,
        description: "Processing time in milliseconds",
      },
      securityAnalysis: {
        $ref: "#/components/schemas/SecurityAnalysis",
        description: "Detailed security analysis results",
      },
    },
  },
  SecurityAnalysis: {
    type: "object",
    properties: {
      nsfw: {
        $ref: "#/components/schemas/NSFWAnalysisResult",
        description: "NSFW content analysis results",
      },
      keywords: {
        $ref: "#/components/schemas/KeywordAnalysisResult",
        description: "Keyword analysis results",
      },
      video: {
        $ref: "#/components/schemas/VideoAnalysisResult",
        description: "Video analysis results (if applicable)",
      },
      overall: {
        $ref: "#/components/schemas/OverallRiskAssessment",
        description: "Overall risk assessment",
      },
    },
  },
  NSFWAnalysisResult: {
    type: "object",
    properties: {
      isNSFW: {
        type: "boolean",
        example: false,
        description: "Whether NSFW content was detected",
      },
      confidence: {
        type: "number",
        minimum: 0,
        maximum: 1,
        example: 0.95,
        description: "Confidence score of the NSFW detection",
      },
      method: {
        type: "string",
        enum: ["nsfwjs", "heuristic", "manual"],
        example: "nsfwjs",
        description: "Detection method used",
      },
      predictions: {
        type: "object",
        properties: {
          Drawing: { type: "number", example: 0.8 },
          Hentai: { type: "number", example: 0.05 },
          Neutral: { type: "number", example: 0.1 },
          Porn: { type: "number", example: 0.02 },
          Sexy: { type: "number", example: 0.03 },
        },
        description: "NSFW prediction scores by category",
      },
      reasons: {
        type: "array",
        items: { type: "string" },
        example: ["High confidence neutral content"],
        description: "Reasons for the classification",
      },
    },
  },
  KeywordAnalysisResult: {
    type: "object",
    properties: {
      isSuspicious: {
        type: "boolean",
        example: false,
        description: "Whether suspicious keywords were found",
      },
      confidence: {
        type: "number",
        minimum: 0,
        maximum: 1,
        example: 0.0,
        description: "Confidence score of keyword detection",
      },
      severity: {
        type: "string",
        enum: ["low", "medium", "high"],
        example: "low",
        description: "Severity level of detected keywords",
      },
      matches: {
        type: "array",
        items: {
          type: "object",
          properties: {
            keyword: { type: "string", example: "inappropriate" },
            category: { type: "string", example: "sexual" },
            position: { type: "number", example: 45 },
          },
        },
        description: "Matched suspicious keywords",
      },
      categories: {
        type: "object",
        properties: {
          sexual: { type: "number", example: 0 },
          violence: { type: "number", example: 0 },
          drugs: { type: "number", example: 0 },
          abusive: { type: "number", example: 0 },
          fraud: { type: "number", example: 0 },
        },
        description: "Keyword matches by category",
      },
    },
  },
  VideoAnalysisResult: {
    type: "object",
    properties: {
      isNSFW: {
        type: "boolean",
        example: false,
        description: "Whether NSFW content was detected in video",
      },
      confidence: {
        type: "number",
        minimum: 0,
        maximum: 1,
        example: 0.0,
        description: "Confidence score of video analysis",
      },
      framesAnalyzed: {
        type: "integer",
        example: 10,
        description: "Number of frames analyzed",
      },
      details: {
        type: "object",
        properties: {
          duration: { type: "number", example: 30.5 },
          resolution: { type: "string", example: "1920x1080" },
          frameRate: { type: "number", example: 30 },
          suspiciousFrames: { type: "number", example: 0 },
        },
        description: "Video analysis details",
      },
    },
  },
  OverallRiskAssessment: {
    type: "object",
    properties: {
      riskScore: {
        type: "number",
        minimum: 0,
        maximum: 1,
        example: 0.1,
        description: "Overall risk score (0-1)",
      },
      riskLevel: {
        type: "string",
        enum: ["low", "medium", "high", "critical"],
        example: "low",
        description: "Overall risk level",
      },
      riskFactors: {
        type: "array",
        items: { type: "string" },
        example: ["No significant risk factors detected"],
        description: "Identified risk factors",
      },
    },
  },
};