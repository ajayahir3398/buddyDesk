const express = require('express');
const router = express.Router();
const iapController = require('../controllers/iap.controller');

/**
 * Webhook endpoints for In-App Purchases
 * These endpoints do NOT require authentication (verified differently)
 */

/**
 * @swagger
 * /webhooks/google/pubsub:
 *   post:
 *     summary: Google Play Real-time Developer Notifications webhook
 *     tags: [Webhooks]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Notification processed
 */
router.post('/google/pubsub', iapController.handleGoogleWebhook);

/**
 * @swagger
 * /webhooks/apple/notifications:
 *   post:
 *     summary: Apple App Store Server Notifications webhook
 *     tags: [Webhooks]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               signedPayload:
 *                 type: string
 *     responses:
 *       200:
 *         description: Notification processed
 */
router.post('/apple/notifications', iapController.handleAppleWebhook);

module.exports = router;

