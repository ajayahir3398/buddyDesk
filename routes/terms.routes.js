const express = require("express");
const router = express.Router();
const termsController = require("../controllers/terms.controller");
const { authenticateToken } = require("../middlewares/auth");
const { body } = require("express-validator");
const { handleValidationErrors } = require("../middlewares/validation");

// Validation for terms acceptance
const validateTermsAcceptance = [
  body("version")
    .notEmpty()
    .withMessage("Version is required")
    .isString()
    .withMessage("Version must be a string"),
  handleValidationErrors
];

/**
 * @swagger
 * tags:
 *   name: Terms & Conditions
 *   description: Terms and conditions acceptance management
 */

/**
 * @swagger
 * /terms/accept:
 *   post:
 *     summary: Accept terms and conditions
 *     description: Record user's acceptance of terms and conditions with timestamp and device details
 *     tags: [Terms & Conditions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - version
 *             properties:
 *               version:
 *                 type: string
 *                 description: Version of terms and conditions being accepted
 *                 example: "1.0"
 *               platform:
 *                 type: string
 *                 description: Platform (iOS, Android, Web)
 *                 example: "Android"
 *               deviceType:
 *                 type: string
 *                 description: Type of device
 *                 example: "Mobile"
 *               appVersion:
 *                 type: string
 *                 description: Application version
 *                 example: "2.1.0"
 *               osVersion:
 *                 type: string
 *                 description: Operating system version
 *                 example: "Android 13"
 *     responses:
 *       201:
 *         description: Terms accepted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Terms and conditions accepted successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     version:
 *                       type: string
 *                       example: "1.0"
 *                     accepted_at:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Bad request - version required
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post(
  "/accept",
  authenticateToken,
  validateTermsAcceptance,
  termsController.acceptTerms
);

/**
 * @swagger
 * /terms/check:
 *   get:
 *     summary: Check if user has accepted terms
 *     description: Check if the authenticated user has accepted a specific version of terms and conditions
 *     tags: [Terms & Conditions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: version
 *         schema:
 *           type: string
 *         description: Terms version to check (defaults to current version)
 *         example: "1.0"
 *     responses:
 *       200:
 *         description: Check result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     hasAccepted:
 *                       type: boolean
 *                       example: true
 *                     version:
 *                       type: string
 *                       example: "1.0"
 *                     acceptedAt:
 *                       type: string
 *                       format: date-time
 *                       nullable: true
 *                     acceptanceDetails:
 *                       type: object
 *                       nullable: true
 *                       properties:
 *                         id:
 *                           type: integer
 *                         version:
 *                           type: string
 *                         accepted_at:
 *                           type: string
 *                           format: date-time
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get("/check", authenticateToken, termsController.checkTermsAcceptance);

/**
 * @swagger
 * /terms/history:
 *   get:
 *     summary: Get user's terms acceptance history
 *     description: Retrieve the history of all terms acceptances by the authenticated user
 *     tags: [Terms & Conditions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Records per page
 *     responses:
 *       200:
 *         description: Acceptance history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     acceptances:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           version:
 *                             type: string
 *                           ip_address:
 *                             type: string
 *                           accepted_at:
 *                             type: string
 *                             format: date-time
 *                           created_at:
 *                             type: string
 *                             format: date-time
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         currentPage:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *                         totalRecords:
 *                           type: integer
 *                         recordsPerPage:
 *                           type: integer
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get("/history", authenticateToken, termsController.getAcceptanceHistory);

/**
 * @swagger
 * /terms/latest:
 *   get:
 *     summary: Get user's latest terms acceptance
 *     description: Retrieve the most recent terms acceptance by the authenticated user
 *     tags: [Terms & Conditions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Latest acceptance retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     version:
 *                       type: string
 *                     accepted_at:
 *                       type: string
 *                       format: date-time
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *       404:
 *         description: No acceptance found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get("/latest", authenticateToken, termsController.getLatestAcceptance);

/**
 * @swagger
 * /terms/admin/all:
 *   get:
 *     summary: Get all terms acceptances (Admin)
 *     description: Retrieve all terms acceptances with filtering options (Admin only)
 *     tags: [Terms & Conditions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Records per page
 *       - in: query
 *         name: version
 *         schema:
 *           type: string
 *         description: Filter by terms version
 *       - in: query
 *         name: userId
 *         schema:
 *           type: integer
 *         description: Filter by user ID
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by start date (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by end date (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Acceptances retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get("/admin/all", authenticateToken, termsController.getAllAcceptances);

/**
 * @swagger
 * /terms/admin/stats:
 *   get:
 *     summary: Get terms acceptance statistics (Admin)
 *     description: Retrieve statistics about terms acceptances (Admin only)
 *     tags: [Terms & Conditions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: version
 *         schema:
 *           type: string
 *         description: Filter statistics by version
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalAcceptances:
 *                       type: integer
 *                       example: 1500
 *                     uniqueUsers:
 *                       type: integer
 *                       example: 950
 *                     acceptancesByVersion:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           version:
 *                             type: string
 *                           count:
 *                             type: integer
 *                     recentAcceptances:
 *                       type: object
 *                       properties:
 *                         count:
 *                           type: integer
 *                         period:
 *                           type: string
 *                           example: "last 7 days"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get("/admin/stats", authenticateToken, termsController.getAcceptanceStats);

module.exports = router;

