const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const Tesseract = require('tesseract.js');

class KeywordFilteringService {
  constructor() {
    // Comprehensive regex patterns for suspicious content
    this.suspiciousPatterns = [
      // Sexual / Nudity
      /\bn+u+d+e+\b/gi,
      /\bp[o0]rn+\b/gi,
      /\bs[e3]x+\b/gi,
      /\bhentai\b/gi,
      /\berotic\b/gi,
      /\b(blowjob|bj)\b/gi,
      /\banal\b/gi,
      /\bnaked\b/gi,
      /\b(tits|boobs|b00bs)\b/gi,
      /\b(cock|dick|pussy|vagina)\b/gi,
      /\b(cum|orgasm|fetish)\b/gi,
      /\b(hardcore|gangbang|masturbat(e|ion))\b/gi,
      /\b(slut|whore|incest|rape)\b/gi,

      // Violence / Terror
      /\b(kill|murder|slaughter|blood|genocide)\b/gi,
      /\b(bomb|explosive|attack|shoot|gun|knife)\b/gi,
      /\b(terror|jihad|suicide|massacre|execute|decapitate)\b/gi,
      /\b(violence|violent|assault|abuse)\b/gi,

      // Drugs
      /\b(drug|cocaine|heroin|weed|marijuana|meth|ecstasy|lsd|opium|ganja|crack)\b/gi,
      /\b(overdose|trafficking|narcotic|cannabis|hashish)\b/gi,

      // Abusive / Hate Speech
      /\b(fuck|f\*ck|fuk|fuxx|phuck)\b/gi,
      /\b(shit|sh1t|shet)\b/gi,
      /\b(asshole|a\*shole|azzhole)\b/gi,
      /\b(bitch|b!tch|biatch)\b/gi,
      /\b(cunt|c\*nt)\b/gi,
      /\b(dick|d1ck|dik)\b/gi,
      /\b(motherfucker|m0therfucker|mf)\b/gi,
      /\b(retard|r3tard)\b/gi,
      /\b(faggot|f@g|f4g)\b/gi,
      /\b(nigger|ni99er|n1gger)\b/gi,
      /\b(chutiya|madarchod|bhenchod|randi|ullu)\b/gi,
      /\b(slut|s1ut)\b/gi,

      // Fraud / Scam
      /\b(lottery|free money|win cash)\b/gi,
      /\b(credit card|loan|hack|h@ck|crack)\b/gi,
      /\b(cheat|fake|scam|phishing|fraud)\b/gi,
      /\b(bitcoin giveaway|investment scheme)\b/gi,
      /\b(get rich quick|make money fast)\b/gi
    ];

    // Category mapping for better reporting
    this.categoryPatterns = {
      sexual: [
        /\bn+u+d+e+\b/gi, /\bp[o0]rn+\b/gi, /\bs[e3]x+\b/gi, /\bhentai\b/gi,
        /\berotic\b/gi, /\b(blowjob|bj)\b/gi, /\banal\b/gi, /\bnaked\b/gi,
        /\b(tits|boobs|b00bs)\b/gi, /\b(cock|dick|pussy|vagina)\b/gi
      ],
      violence: [
        /\b(kill|murder|slaughter|blood|genocide)\b/gi,
        /\b(bomb|explosive|attack|shoot|gun|knife)\b/gi,
        /\b(terror|jihad|suicide|massacre|execute|decapitate)\b/gi
      ],
      drugs: [
        /\b(drug|cocaine|heroin|weed|marijuana|meth|ecstasy|lsd|opium|ganja|crack)\b/gi,
        /\b(overdose|trafficking|narcotic|cannabis|hashish)\b/gi
      ],
      abusive: [
        /\b(fuck|f\*ck|fuk|fuxx|phuck)\b/gi, /\b(shit|sh1t|shet)\b/gi,
        /\b(asshole|a\*shole|azzhole)\b/gi, /\b(bitch|b!tch|biatch)\b/gi,
        /\b(cunt|c\*nt)\b/gi, /\b(motherfucker|m0therfucker|mf)\b/gi
      ],
      fraud: [
        /\b(lottery|free money|win cash)\b/gi, /\b(credit card|loan|hack|h@ck|crack)\b/gi,
        /\b(cheat|fake|scam|phishing|fraud)\b/gi, /\b(bitcoin giveaway|investment scheme)\b/gi
      ]
    };

    // Severity scoring
    this.severityWeights = {
      sexual: 0.9,
      violence: 0.8,
      drugs: 0.7,
      abusive: 0.6,
      fraud: 0.5
    };
  }

  // Main method to check text for suspicious keywords
  checkSuspiciousText(text) {
    if (!text || typeof text !== 'string') {
      return {
        isSuspicious: false,
        confidence: 0,
        matches: [],
        categories: {},
        severity: 'low'
      };
    }

    const matches = [];
    const categories = {};
    let maxSeverity = 0;

    // Check each category
    for (const [category, patterns] of Object.entries(this.categoryPatterns)) {
      const categoryMatches = [];
      
      for (const pattern of patterns) {
        const found = text.match(pattern);
        if (found) {
          categoryMatches.push(...found);
        }
      }

      if (categoryMatches.length > 0) {
        categories[category] = [...new Set(categoryMatches)];
        matches.push(...categoryMatches);
        maxSeverity = Math.max(maxSeverity, this.severityWeights[category] || 0.3);
      }
    }

    // Remove duplicates
    const uniqueMatches = [...new Set(matches)];
    
    // Calculate confidence based on number and severity of matches
    const confidence = Math.min(1.0, (uniqueMatches.length * 0.2) + maxSeverity);
    
    return {
      isSuspicious: uniqueMatches.length > 0,
      confidence,
      matches: uniqueMatches,
      categories,
      severity: this.getSeverityLevel(confidence),
      matchCount: uniqueMatches.length
    };
  }

  // Extract text from PDF files
  async extractTextFromPDF(filePath) {
    try {
      const dataBuffer = fs.readFileSync(filePath);
      const pdfData = await pdfParse(dataBuffer);
      return {
        success: true,
        text: pdfData.text,
        pages: pdfData.numpages,
        info: pdfData.info
      };
    } catch (error) {
      console.error('PDF text extraction failed:', error);
      return {
        success: false,
        error: error.message,
        text: ''
      };
    }
  }

  // Extract text from images using OCR
  async extractTextFromImage(filePath) {
    try {
      const { data: { text, confidence } } = await Tesseract.recognize(filePath, 'eng', {
        logger: m => {} // Suppress logs
      });
      
      return {
        success: true,
        text: text.trim(),
        confidence: confidence,
        method: 'OCR'
      };
    } catch (error) {
      console.error('OCR text extraction failed:', error);
      return {
        success: false,
        error: error.message,
        text: ''
      };
    }
  }

  // Extract text from DOCX files (placeholder - would need docx library)
  async extractTextFromDOCX(filePath) {
    try {
      // This is a placeholder - in production you'd use a proper DOCX parser
      // For now, we'll just check the filename
      const filename = path.basename(filePath);
      return {
        success: true,
        text: filename,
        method: 'filename-only',
        note: 'Full DOCX parsing not implemented'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        text: ''
      };
    }
  }

  // Main method to analyze file content
  async analyzeFileContent(filePath, mimeType) {
    try {
      let extractedText = '';
      let extractionResult = null;
      
      // Extract text based on file type
      if (mimeType === 'application/pdf') {
        extractionResult = await this.extractTextFromPDF(filePath);
        extractedText = extractionResult.text;
      } else if (mimeType.startsWith('image/')) {
        extractionResult = await this.extractTextFromImage(filePath);
        extractedText = extractionResult.text;
      } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        extractionResult = await this.extractTextFromDOCX(filePath);
        extractedText = extractionResult.text;
      } else if (mimeType === 'text/plain') {
        extractedText = fs.readFileSync(filePath, 'utf8');
        extractionResult = { success: true, text: extractedText, method: 'direct-read' };
      }

      // Also check filename
      const filename = path.basename(filePath);
      const filenameCheck = this.checkSuspiciousText(filename);
      const contentCheck = this.checkSuspiciousText(extractedText);

      // Combine results
      const combinedMatches = [...filenameCheck.matches, ...contentCheck.matches];
      const combinedCategories = { ...filenameCheck.categories };
      
      // Merge categories
      for (const [category, matches] of Object.entries(contentCheck.categories)) {
        if (combinedCategories[category]) {
          combinedCategories[category] = [...combinedCategories[category], ...matches];
        } else {
          combinedCategories[category] = matches;
        }
      }

      const maxConfidence = Math.max(filenameCheck.confidence, contentCheck.confidence);
      const isSuspicious = filenameCheck.isSuspicious || contentCheck.isSuspicious;

      return {
        isSuspicious,
        confidence: maxConfidence,
        matches: [...new Set(combinedMatches)],
        categories: combinedCategories,
        severity: this.getSeverityLevel(maxConfidence),
        extraction: extractionResult,
        details: {
          filename: filenameCheck,
          content: contentCheck,
          extractedTextLength: extractedText.length
        }
      };
    } catch (error) {
      console.error('File content analysis failed:', error);
      return {
        isSuspicious: false,
        confidence: 0,
        matches: [],
        categories: {},
        severity: 'low',
        error: error.message
      };
    }
  }

  // Get severity level based on confidence
  getSeverityLevel(confidence) {
    if (confidence >= 0.8) return 'critical';
    if (confidence >= 0.6) return 'high';
    if (confidence >= 0.4) return 'medium';
    if (confidence >= 0.2) return 'low';
    return 'minimal';
  }

  // Get category-specific thresholds
  getCategoryThreshold(category) {
    const thresholds = {
      sexual: 0.7,
      violence: 0.8,
      drugs: 0.6,
      abusive: 0.5,
      fraud: 0.6
    };
    return thresholds[category] || 0.5;
  }

  // Check if content should be blocked based on category and confidence
  shouldBlockContent(analysisResult) {
    if (!analysisResult.isSuspicious) return false;
    
    // Block if any high-severity category exceeds threshold
    for (const [category, matches] of Object.entries(analysisResult.categories)) {
      const threshold = this.getCategoryThreshold(category);
      const categoryWeight = this.severityWeights[category] || 0.3;
      const categoryConfidence = Math.min(1.0, matches.length * 0.3 + categoryWeight);
      
      if (categoryConfidence >= threshold) {
        return true;
      }
    }
    
    // Also block if overall confidence is very high
    return analysisResult.confidence >= 0.7;
  }
}

module.exports = KeywordFilteringService;