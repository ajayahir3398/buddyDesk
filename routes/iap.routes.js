const express = require('express');
const router = express.Router();
const { body, query, param } = require('express-validator');
const { authenticateToken } = require('../middlewares/auth');
const iapController = require('../controllers/iap.controller');

/**
 * @swagger
 * /iap/validate:
 *   post:
 *     summary: Validate a purchase from client
 *     tags: [In-App Purchases]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - platform
 *               - purchaseToken
 *               - productId
 *             properties:
 *               platform:
 *                 type: string
 *                 enum: [play, appstore]
 *                 description: Purchase platform
 *               purchaseToken:
 *                 type: string
 *                 description: Purchase token (Google) or transaction ID (Apple)
 *               productId:
 *                 type: string
 *                 description: Product/subscription ID
 *               appAccountToken:
 *                 type: string
 *                 description: Optional app account token for linking
 *     responses:
 *       200:
 *         description: Purchase validated successfully
 *       400:
 *         description: Invalid request
 *       500:
 *         description: Server error
 */
router.post('/validate', authenticateToken, [
  body('platform').isIn(['play', 'appstore']).withMessage('Platform must be play or appstore'),
  body('purchaseToken').isString().notEmpty().withMessage('Purchase token is required'),
  body('productId').isString().notEmpty().withMessage('Product ID is required'),
  body('appAccountToken').optional().isString()
], iapController.validatePurchase);

/**
 * @swagger
 * /iap/store-purchase-data:
 *   post:
 *     summary: Store subscription purchase data as JSON string
 *     tags: [In-App Purchases]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - platform
 *               - purchase_data
 *             properties:
 *               platform:
 *                 type: string
 *                 enum: [play, appstore]
 *                 description: Purchase platform (play store or app store)
 *               purchase_data:
 *                 type: string
 *                 description: Raw purchase data as string (can be JSON or any other format)
 *                 example: '{"productId":"premium_monthly","purchaseToken":"abc123"}'
 *     responses:
 *       201:
 *         description: Purchase data stored successfully
 *       400:
 *         description: Invalid request data
 *       500:
 *         description: Server error
 */
router.post('/store-purchase-data', authenticateToken, [
  body('platform').isIn(['play', 'appstore']).withMessage('Platform must be play or appstore'),
  body('purchase_data').isString().notEmpty().withMessage('Purchase data as string is required')
], iapController.storePurchaseData);

/**
 * @swagger
 * /iap/subscriptions:
 *   get:
 *     summary: Get user's subscriptions
 *     tags: [In-App Purchases]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Subscriptions retrieved successfully
 *       500:
 *         description: Server error
 */
router.get('/subscriptions', authenticateToken, iapController.getUserSubscriptions);

/**
 * @swagger
 * /iap/subscriptions/{id}:
 *   get:
 *     summary: Get specific subscription details
 *     tags: [In-App Purchases]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Subscription ID
 *     responses:
 *       200:
 *         description: Subscription details retrieved
 *       404:
 *         description: Subscription not found
 *       500:
 *         description: Server error
 */
router.get('/subscriptions/:id', authenticateToken, [
  param('id').isUUID().withMessage('Invalid subscription ID')
], iapController.getSubscriptionDetails);

/**
 * @swagger
 * /iap/status:
 *   get:
 *     summary: Check subscription status
 *     tags: [In-App Purchases]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: productId
 *         schema:
 *           type: string
 *         description: Optional product ID to check specific subscription
 *     responses:
 *       200:
 *         description: Status retrieved successfully
 *       500:
 *         description: Server error
 */
router.get('/status', authenticateToken, [
  query('productId').optional().isString()
], iapController.checkSubscriptionStatus);

/**
 * @swagger
 * /iap/refresh/{id}:
 *   post:
 *     summary: Refresh subscription from store
 *     tags: [In-App Purchases]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Subscription ID
 *     responses:
 *       200:
 *         description: Subscription refreshed
 *       404:
 *         description: Subscription not found
 *       500:
 *         description: Server error
 */
router.post('/refresh/:id', authenticateToken, [
  param('id').isUUID().withMessage('Invalid subscription ID')
], iapController.refreshSubscription);

module.exports = router;

