const AadhaarVerificationService = require("../services/aadhaarVerificationService");
const logger = require("../utils/logger");
const { validationResult } = require("express-validator");
const db = require("../models");

class AadhaarController {
  constructor() {
    this.verificationService = new AadhaarVerificationService();
  }

  /**
   * Verify Aadhaar ZIP file (offline eKYC)
   * All Swagger documentation is defined in config/swagger.config.js
   */
  async verifyZIP(req, res) {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          requestId: req.requestId,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          requestId: req.requestId,
          message: "ZIP file is required",
        });
      }

      const { shareCode } = req.body;
      const zipFileBuffer = req.file.buffer;
      const userId = req.user.id;
      const ipAddress = req.ip;
      const userAgent = req.get("User-Agent");

      logger.info(`ZIP verification requested by user: ${userId}`, {
        requestId: req.requestId,
        userId,
        fileSize: zipFileBuffer.length,
      });

      const result = await this.verificationService.verifyAadhaarZIP(
        zipFileBuffer,
        shareCode,
        userId,
        ipAddress,
        userAgent
      );

      const statusCode = result.success ? 200 : 400;

      logger.info(`ZIP verification completed for user: ${userId}`, {
        requestId: req.requestId,
        userId,
        success: result.success,
        verificationId: result.verificationId,
      });

      return res.status(statusCode).json({
        ...result,
        requestId: req.requestId,
      });
    } catch (error) {
      logger.error("ZIP verification controller error:", {
        error: error.message,
        stack: error.stack,
        requestId: req.requestId,
        userId: req.user?.userId,
      });

      return res.status(500).json({
        success: false,
        requestId: req.requestId,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Something went wrong",
      });
    }
  }

  /**
   * Verify Aadhaar XML file (offline eKYC)
   * All Swagger documentation is defined in config/swagger.config.js
   */
  async verifyXML(req, res) {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          requestId: req.requestId,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const { xmlData, shareCode } = req.body;

      if (!xmlData) {
        return res.status(400).json({
          success: false,
          requestId: req.requestId,
          message: "XML data is required",
        });
      }

      if (!shareCode) {
        return res.status(400).json({
          success: false,
          requestId: req.requestId,
          message: "Share code is required",
        });
      }

      const userId = req.user.id;
      const ipAddress = req.ip;
      const userAgent = req.get("User-Agent");

      logger.info(`XML verification requested by user: ${userId}`, {
        requestId: req.requestId,
        userId,
        xmlDataLength: xmlData.length,
      });

      const result = await this.verificationService.verifyAadhaarXML(
        xmlData,
        shareCode,
        userId,
        ipAddress,
        userAgent
      );

      const statusCode = result.success ? 200 : 400;

      logger.info(`XML verification completed for user: ${userId}`, {
        requestId: req.requestId,
        userId,
        success: result.success,
        verificationId: result.verificationId,
      });

      return res.status(statusCode).json({
        ...result,
        requestId: req.requestId,
      });
    } catch (error) {
      logger.error("XML verification controller error:", {
        error: error.message,
        stack: error.stack,
        requestId: req.requestId,
        userId: req.user?.userId,
      });

      return res.status(500).json({
        success: false,
        requestId: req.requestId,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Something went wrong",
      });
    }
  }

  /**
   * Verify Aadhaar QR code
   * All Swagger documentation is defined in config/swagger.config.js
   */
  async verifyQR(req, res) {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          requestId: req.requestId,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          requestId: req.requestId,
          message: "QR image file is required",
        });
      }

      const qrImageBuffer = req.file.buffer;
      const userId = req.user.id;
      const ipAddress = req.ip;
      const userAgent = req.get("User-Agent");

      logger.info(`QR verification requested by user: ${userId}`, {
        requestId: req.requestId,
        userId,
        fileSize: qrImageBuffer.length,
      });

      const result = await this.verificationService.verifyAadhaarQR(
        qrImageBuffer,
        userId,
        ipAddress,
        userAgent
      );

      const statusCode = result.success ? 200 : 400;

      logger.info(`QR verification completed for user: ${userId}`, {
        requestId: req.requestId,
        userId,
        success: result.success,
        verificationId: result.verificationId,
      });

      return res.status(statusCode).json({
        ...result,
        requestId: req.requestId,
      });
    } catch (error) {
      logger.error("QR verification controller error:", {
        error: error.message,
        stack: error.stack,
        requestId: req.requestId,
        userId: req.user?.userId,
      });

      return res.status(500).json({
        success: false,
        requestId: req.requestId,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Something went wrong",
      });
    }
  }

  /**
   * Validate Aadhaar number format
   * All Swagger documentation is defined in config/swagger.config.js
   */
  async validateNumber(req, res) {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          requestId: req.requestId,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const { aadhaarNumber } = req.body;
      const userId = req.user.id;
      const ipAddress = req.ip;
      const userAgent = req.get("User-Agent");

      logger.info(`Number validation requested by user: ${userId}`, {
        requestId: req.requestId,
        userId,
      });

      const result = await this.verificationService.validateAadhaarNumber(
        aadhaarNumber,
        userId,
        ipAddress,
        userAgent
      );

      const statusCode = result.success ? 200 : 400;

      logger.info(`Number validation completed for user: ${userId}`, {
        requestId: req.requestId,
        userId,
        success: result.success,
        verificationId: result.verificationId,
      });

      return res.status(statusCode).json({
        ...result,
        requestId: req.requestId,
      });
    } catch (error) {
      logger.error("Number validation controller error:", {
        error: error.message,
        stack: error.stack,
        requestId: req.requestId,
        userId: req.user?.userId,
      });

      return res.status(500).json({
        success: false,
        requestId: req.requestId,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Something went wrong",
      });
    }
  }

  /**
   * Get verification history for the authenticated user
   * All Swagger documentation is defined in config/swagger.config.js
   */
  async getVerificationHistory(req, res) {
    try {
      const userId = req.user.id;
      const limit = parseInt(req.query.limit) || 10;
      const offset = parseInt(req.query.offset) || 0;

      // Validate limit and offset
      if (limit < 1 || limit > 100) {
        return res.status(400).json({
          success: false,
          requestId: req.requestId,
          message: "Limit must be between 1 and 100",
        });
      }

      if (offset < 0) {
        return res.status(400).json({
          success: false,
          requestId: req.requestId,
          message: "Offset must be 0 or greater",
        });
      }

      logger.info(`Verification history requested by user: ${userId}`, {
        requestId: req.requestId,
        userId,
        limit,
        offset,
      });

      const result = await this.verificationService.getVerificationHistory(
        userId,
        limit,
        offset
      );

      const statusCode = result.success ? 200 : 500;

      return res.status(statusCode).json({
        ...result,
        requestId: req.requestId,
      });
    } catch (error) {
      logger.error("Verification history controller error:", {
        error: error.message,
        stack: error.stack,
        requestId: req.requestId,
        userId: req.user?.userId,
      });

      return res.status(500).json({
        success: false,
        requestId: req.requestId,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Something went wrong",
      });
    }
  }

  /**
   * Get user's Aadhaar verification status
   * All Swagger documentation is defined in config/swagger.config.js
   */
  async getVerificationStatus(req, res) {
    try {
      const userId = req.user.id;

      logger.info(`Verification status requested by user: ${userId}`, {
        requestId: req.requestId,
        userId,
      });

      // Find the most recent successful verification for the user
      const latestVerification = await db.AadhaarVerification.findOne({
        where: {
          userId: userId,
          verificationStatus: "SUCCESS",
          deletedAt: null,
        },
        order: [["verificationTime", "DESC"]],
        attributes: [
          "id",
          "verificationId",
          "verificationType",
          "verificationStatus",
          "maskedAadhaarNumber",
          "verificationData",
          "signatureValid",
          "timestampValid",
          "certificateValid",
          "verificationTime",
          "createdAt",
        ],
      });

      const isVerified = !!latestVerification;

      const response = {
        success: true,
        requestId: req.requestId,
        data: {
          isVerified: isVerified,
          verificationStatus: isVerified ? "VERIFIED" : "NOT_VERIFIED",
        },
      };

      // If user is verified, include verification details
      if (isVerified) {
        response.data.verificationDetails = {
          verificationId: latestVerification.verificationId,
          verificationType: latestVerification.verificationType,
          maskedAadhaarNumber: latestVerification.maskedAadhaarNumber,
          verificationTime: latestVerification.verificationTime,
          signatureValid: latestVerification.signatureValid,
          timestampValid: latestVerification.timestampValid,
          certificateValid: latestVerification.certificateValid,
          personalDetails: latestVerification.verificationData
            ? {
                name: latestVerification.verificationData.name,
                dateOfBirth: latestVerification.verificationData.dateOfBirth,
                gender: latestVerification.verificationData.gender,
                phone: latestVerification.verificationData.phone
                  ? latestVerification.verificationData.phone.replace(
                      /.(?=.{4})/g,
                      "X"
                    )
                  : null,
                email: latestVerification.verificationData.email
                  ? latestVerification.verificationData.email.replace(
                      /(.{2})(.*)(@.*)/,
                      "$1***$3"
                    )
                  : null,
                address: latestVerification.verificationData.address,
              }
            : null,
        };
      }

      logger.info(`Verification status retrieved for user: ${userId}`, {
        requestId: req.requestId,
        userId,
        isVerified,
        verificationId: latestVerification?.verificationId,
      });

      return res.status(200).json(response);
    } catch (error) {
      logger.error("Verification status controller error:", {
        error: error.message,
        stack: error.stack,
        requestId: req.requestId,
        userId: req.user?.id,
      });

      return res.status(500).json({
        success: false,
        requestId: req.requestId,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Something went wrong",
      });
    }
  }

  /**
   * Get details of a specific verification
   * All Swagger documentation is defined in config/swagger.config.js
   */
  async getVerificationDetails(req, res) {
    try {
      const { verificationId } = req.params;
      const userId = req.user.id;

      logger.info(`Verification details requested by user: ${userId}`, {
        requestId: req.requestId,
        userId,
        verificationId,
      });

      const verification = await db.AadhaarVerification.findOne({
        where: {
          verification_id: verificationId,
          user_id: userId,
        },
        attributes: {
          exclude: ["aadhaar_number"], // Exclude sensitive data
        },
        include: [
          {
            model: db.AadhaarVerificationLog,
            as: "logs",
            order: [["timestamp", "ASC"]],
          },
        ],
      });

      if (!verification) {
        return res.status(404).json({
          success: false,
          requestId: req.requestId,
          message: "Verification not found",
        });
      }

      return res.status(200).json({
        success: true,
        requestId: req.requestId,
        data: verification,
      });
    } catch (error) {
      logger.error("Verification details controller error:", {
        error: error.message,
        stack: error.stack,
        requestId: req.requestId,
        userId: req.user?.userId,
      });

      return res.status(500).json({
        success: false,
        requestId: req.requestId,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Something went wrong",
      });
    }
  }
}

module.exports = new AadhaarController();
