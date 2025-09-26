const { validationResult } = require('express-validator');
const notificationService = require('../services/notificationService');
const db = require('../models');

async function saveToken(req, res) {
	const errors = validationResult(req);
	if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

	const userId = req.user && req.user.id ? req.user.id : req.body.userId;
	const { fcmToken, platform, deviceInfo } = req.body;
	if (!userId) return res.status(400).json({ message: 'userId required' });

	try {
		const record = await notificationService.saveOrUpdateToken({ userId, fcmToken, platform, deviceInfo });
		return res.json({ success: true, id: record.id });
	} catch (err) {
		return res.status(500).json({ message: 'Failed to save token' });
	}
}

async function sendTest(req, res) {
	const errors = validationResult(req);
	if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

	const userId = req.body.userId || (req.user && req.user.id);
	const { title, body, data } = req.body;
	if (!userId) return res.status(400).json({ message: 'userId required' });

	try {
		const result = await notificationService.sendPushToUser(userId, {
			notification: { title: title || 'Test', body: body || 'Test notification' },
			data: data || {}
		});
		return res.json({ success: true, ...result });
	} catch (err) {
		return res.status(500).json({ message: 'Failed to send', error: err.message });
	}
}

// Get user notifications with pagination
async function getUserNotifications(req, res) {
	try {
		const userId = req.user.id;
		const page = parseInt(req.query.page) || 1;
		const limit = Math.min(parseInt(req.query.limit) || 20, 50); // Max 50 notifications per page
		const offset = (page - 1) * limit;
		const type = req.query.type; // Optional filter by notification type

		// Build where clause
		const where = { user_id: userId };
		if (type) {
			where.type = type;
		}

		const { count, rows: notifications } = await db.Notification.findAndCountAll({
			where,
			include: [
				{
					model: db.Post,
					as: 'post',
					attributes: ['id', 'title', 'description', 'medium', 'status'],
					include: [
						{
							model: db.User,
							as: 'user',
							attributes: ['id', 'name']
						},
						{
							model: db.Skill,
							as: 'requiredSkill',
							attributes: ['id', 'name']
						}
					]
				},
				{
					model: db.Message,
					as: 'message',
					attributes: ['id', 'content'],
					include: [
						{
							model: db.User,
							as: 'sender',
							attributes: ['id', 'name']
						}
					]
				},
				{
					model: db.Conversation,
					as: 'conversation',
					attributes: ['id', 'name', 'type']
				}
			],
			order: [['created_at', 'DESC']],
			limit,
			offset
		});

		// Count unread notifications
		const unreadCount = await db.Notification.count({
			where: {
				user_id: userId,
				is_read: false
			}
		});

		res.status(200).json({
			success: true,
			message: 'Notifications retrieved successfully',
			data: {
				notifications,
				pagination: {
					currentPage: page,
					totalPages: Math.ceil(count / limit),
					totalNotifications: count,
					hasNextPage: page < Math.ceil(count / limit),
					hasPreviousPage: page > 1,
					limit
				},
				unreadCount
			}
		});

	} catch (error) {
		console.error('Get user notifications error:', error);
		res.status(500).json({
			success: false,
			message: 'Internal server error',
			error: error.message
		});
	}
}

// Mark notification as read
async function markNotificationAsRead(req, res) {
	try {
		const userId = req.user.id;
		const notificationId = req.params.id;

		const notification = await db.Notification.findOne({
			where: {
				id: notificationId,
				user_id: userId
			}
		});

		if (!notification) {
			return res.status(404).json({
				success: false,
				message: 'Notification not found'
			});
		}

		await notification.update({
			is_read: true,
			read_at: new Date()
		});

		res.status(200).json({
			success: true,
			message: 'Notification marked as read',
			data: notification
		});

	} catch (error) {
		console.error('Mark notification as read error:', error);
		res.status(500).json({
			success: false,
			message: 'Internal server error',
			error: error.message
		});
	}
}

// Mark all notifications as read
async function markAllNotificationsAsRead(req, res) {
	try {
		const userId = req.user.id;

		await db.Notification.update(
			{
				is_read: true,
				read_at: new Date()
			},
			{
				where: {
					user_id: userId,
					is_read: false
				}
			}
		);

		res.status(200).json({
			success: true,
			message: 'All notifications marked as read'
		});

	} catch (error) {
		console.error('Mark all notifications as read error:', error);
		res.status(500).json({
			success: false,
			message: 'Internal server error',
			error: error.message
		});
	}
}

module.exports = { 
	saveToken, 
	sendTest, 
	getUserNotifications, 
	markNotificationAsRead, 
	markAllNotificationsAsRead 
};


