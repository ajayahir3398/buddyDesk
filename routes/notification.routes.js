const express = require('express');
const router = express.Router();
const { body, query, param } = require('express-validator');
const { authenticateToken } = require('../middlewares/auth');
const controller = require('../controllers/notification.controller');

router.post('/token', authenticateToken, [
	body('fcmToken').isString().notEmpty(),
	body('platform').optional().isIn(['ios', 'android', 'web', 'unknown'])
], controller.saveToken);

router.post('/test', authenticateToken, [
	body('userId').optional().isInt({ min: 1 }),
	body('title').optional().isString(),
	body('body').optional().isString(),
	body('data').optional().isObject()
], controller.sendTest);

// Get user notifications with pagination and filtering
router.get('/', authenticateToken, [
	query('page').optional().isInt({ min: 1 }),
	query('limit').optional().isInt({ min: 1, max: 50 }),
	query('type').optional().isIn(['message', 'mention', 'group_invite', 'system', 'post', 'feed_post', 'feed_like', 'feed_comment'])
], controller.getUserNotifications);

// Mark specific notification as read
router.put('/:id/read', authenticateToken, [
	param('id').isInt({ min: 1 })
], controller.markNotificationAsRead);

// Mark all notifications as read
router.put('/read-all', authenticateToken, controller.markAllNotificationsAsRead);

module.exports = router;


