const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
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

module.exports = router;


