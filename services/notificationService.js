const admin = require('../config/firebase');
const db = require('../models');
const logger = require('../utils/logger');

async function saveOrUpdateToken({ userId, fcmToken, platform, deviceInfo }) {
	const [record] = await db.DeviceToken.findOrCreate({
		where: { fcm_token: fcmToken },
		defaults: { user_id: userId, platform: platform || 'unknown', device_info: deviceInfo || null, last_used_at: new Date() }
	});
	if (record.user_id !== userId || record.platform !== platform) {
		await record.update({ user_id: userId, platform: platform || 'unknown', device_info: deviceInfo || null, last_used_at: new Date() });
	} else {
		await record.update({ last_used_at: new Date() });
	}
	return record;
}

async function sendPushToUser(userId, payload) {
	const tokens = await db.DeviceToken.findAll({
		where: { user_id: userId },
		attributes: ['id', 'fcm_token', 'platform', 'last_used_at']
	});

	if (!tokens.length) return { successCount: 0, failureCount: 0, results: [] };

	const registrationTokens = tokens.map(t => t.fcm_token);
	const message = {
		notification: payload.notification || undefined,
		data: payload.data || undefined,
		tokens: registrationTokens
	};

	try {
		const response = await admin.messaging().sendEachForMulticast(message);

		// Cleanup invalid tokens
		const invalidTokenIds = [];
		const invalidTokenDetails = [];

		response.responses.forEach((res, idx) => {
			if (!res.success) {
				const code = res.error && res.error.code;
				if (code === 'messaging/registration-token-not-registered' || code === 'messaging/invalid-registration-token') {
					invalidTokenIds.push(tokens[idx].id);
					invalidTokenDetails.push({
						tokenId: tokens[idx].id,
						platform: tokens[idx].platform,
						errorCode: code,
						tokenPreview: tokens[idx].fcm_token?.substring(0, 20) + '...'
					});
				}
			}
		});

		if (invalidTokenIds.length) {
			await db.DeviceToken.destroy({ where: { id: invalidTokenIds } });
		}

		return {
			successCount: response.successCount,
			failureCount: response.failureCount,
			results: response.responses
		};
	} catch (error) {
		logger.error('❌ FCM PUSH FAILED: Error sending push notification via Firebase', {
			...pushLogContext,
			error: error.message,
			stack: error.stack
		});
		throw error;
	}
}

async function sendPostNotificationToAllUsers(post) {
	try {
		// Find all users with their notification settings
		const allUsers = await db.User.findAll({
			attributes: ['id', 'name'],
			include: [{
				model: db.NotificationSettings,
				as: 'notificationSettings',
				attributes: ['push_notification']
			}]
		});

		// Filter out the post creator and users who have disabled relevant notifications
		const usersToNotify = allUsers.filter(user => {
			if (!user || user.id === post.user_id) {
				return false;
			}

			// Check notification preferences
			const settings = user.notificationSettings;
			if (settings) {
				// Only check push_notification flag
				return settings.push_notification;
			}

			// If no notification settings found, default to sending notifications
			return true;
		});

		if (usersToNotify.length === 0) {
			return { success: true, notificationsSent: 0 };
		}

		// Create notifications and send push notifications
		const notificationPromises = usersToNotify.map(async (user) => {
			try {
				// Create notification in database
				const notification = await db.Notification.create({
					user_id: user.id,
					post_id: post.id,
					type: 'post',
					title: 'New Post Available!',
					body: `A new post has been created: "${post.title || post.description}"`,
					data: {
						post_id: post.id,
						post_title: post.title,
						post_description: post.description
					}
				});

				// Send push notification
				const pushResult = await sendPushToUser(user.id, {
					notification: {
						title: 'New Post Available!',
						body: `A new post has been created: "${post.title || post.description}"`
					},
					data: {
						post_id: post.id.toString(),
						notification_type: 'new_post'
					}
				});

				// Update notification with push status
				if (pushResult.successCount > 0) {
					await notification.update({
						push_sent: true,
						push_sent_at: new Date()
					});
				}

				return { success: true, userId: user.id, pushResult };
			} catch (error) {
				logger.error('Error sending notification to user', {
					userId: user.id,
					postId: post.id,
					error: error.message
				});
				return { success: false, userId: user.id, error: error.message };
			}
		});

		const results = await Promise.all(notificationPromises);
		const successCount = results.filter(r => r.success).length;

		return {
			success: true,
			notificationsSent: successCount,
			totalMatchingUsers: usersToNotify.length,
			results
		};
	} catch (error) {
		logger.error('Error in sendPostNotificationToMatchingUsers', {
			postId: post.id,
			error: error.message,
			stack: error.stack
		});
		return { success: false, error: error.message };
	}
}

async function sendFeedPostNotificationToAllUsers(feedPost) {
	try {
		// Find all users with their notification settings
		const allUsers = await db.User.findAll({
			attributes: ['id', 'name'],
			include: [{
				model: db.NotificationSettings,
				as: 'notificationSettings',
				attributes: ['push_notification']
			}]
		});

		// Filter out the post creator and users who have disabled relevant notifications
		const usersToNotify = allUsers.filter(user => {
			if (!user || user.id === feedPost.user_id) {
				return false;
			}

			// Check notification preferences
			const settings = user.notificationSettings;
			if (settings) {
				// Only check push_notification flag
				return settings.push_notification;
			}

			// If no notification settings found, default to sending notifications
			return true;
		});

		if (usersToNotify.length === 0) {
			return { success: true, notificationsSent: 0 };
		}

		// Create notifications and send push notifications
		const notificationPromises = usersToNotify.map(async (user) => {
			try {
				// Create notification in database
				const notification = await db.Notification.create({
					user_id: user.id,
					post_id: feedPost.id, // Using post_id field instead of feed_post_id
					type: 'post', // Using 'post' type instead of 'feed_post'
					title: 'New Feed Post!',
					body: `A new feed post has been shared`,
					data: {
						feed_post_id: feedPost.id,
						post_content: feedPost.content
					}
				});

				// Send push notification
				const pushResult = await sendPushToUser(user.id, {
					notification: {
						title: 'New Feed Post!',
						body: `A new feed post has been shared`
					},
					data: {
						feed_post_id: feedPost.id.toString(),
						notification_type: 'new_feed_post'
					}
				});

				// Update notification with push status
				if (pushResult.successCount > 0) {
					await notification.update({
						push_sent: true,
						push_sent_at: new Date()
					});
				}

				return { success: true, userId: user.id, pushResult };
			} catch (error) {
				logger.error('Error sending feed post notification to user', {
					userId: user.id,
					feedPostId: feedPost.id,
					error: error.message
				});
				return { success: false, userId: user.id, error: error.message };
			}
		});

		const results = await Promise.all(notificationPromises);
		const successCount = results.filter(r => r.success).length;

		return {
			success: true,
			notificationsSent: successCount,
			totalMatchingUsers: usersToNotify.length,
			results
		};
	} catch (error) {
		logger.error('Error in sendFeedPostNotificationToAllUsers', {
			feedPostId: feedPost.id,
			error: error.message,
			stack: error.stack
		});
		return { success: false, error: error.message };
	}
}

async function sendMessageNotification(message, sender) {
	try {
		// Get conversation members (excluding sender)
		const conversationMembers = await db.ConversationMember.findAll({
			where: {
				conversation_id: message.conversation_id,
				user_id: { [db.Sequelize.Op.ne]: message.sender_id },
				left_at: null
			},
			include: [{
				model: db.User,
				as: 'user',
				attributes: ['id', 'name', 'is_online'],
				include: [{
					model: db.NotificationSettings,
					as: 'notificationSettings',
					attributes: ['push_notification', 'message_notification']
				}]
			}]
		});

		if (conversationMembers.length === 0) {
			return { success: true, notificationsSent: 0 };
		}

		// Filter users who should receive notifications
		const usersToNotify = conversationMembers.filter(member => {
			const settings = member.user.notificationSettings;
			if (!settings) return true; // Default to sending notifications
			
			// Check if user has enabled message notifications
			return settings.message_notification !== false && settings.push_notification !== false;
		});

		if (usersToNotify.length === 0) {
			return { success: true, notificationsSent: 0 };
		}

		// Create notification title and body
		const conversation = await db.Conversation.findByPk(message.conversation_id, {
			attributes: ['type', 'name']
		});

		let title, body;
		if (conversation.type === 'private') {
			title = `New message from ${sender.name}`;
		} else {
			title = `${sender.name} in ${conversation.name || 'Group'}`;
		}

		// Prepare message preview
		if (message.message_type === 'text') {
			body = message.content_plain || '[Message]';
			if (body.length > 100) {
				body = body.substring(0, 100) + '...';
			}
		} else {
			const typeMap = {
				'image': '📷 Photo',
				'video': '🎥 Video',
				'audio': '🎵 Audio',
				'file': '📄 File',
				'system': 'System Message'
			};
			body = typeMap[message.message_type] || '📎 Attachment';
		}

		// Create notifications and send push notifications
		const notificationPromises = usersToNotify.map(async (member) => {
			try {
				// Create notification in database
				const notification = await db.Notification.create({
					user_id: member.user_id,
					message_id: message.id,
					conversation_id: message.conversation_id,
					type: 'message',
					title,
					body,
					data: {
						conversation_id: message.conversation_id,
						message_id: message.id,
						sender_id: message.sender_id,
						sender_name: sender.name,
						message_type: message.message_type
					}
				});

				// Send push notification
				const pushResult = await sendPushToUser(member.user_id, {
					notification: {
						title,
						body
					},
					data: {
						conversation_id: message.conversation_id.toString(),
						message_id: message.id.toString(),
						sender_id: message.sender_id.toString(),
						notification_type: 'new_message'
					}
				});

				// Update notification with push status
				if (pushResult.successCount > 0) {
					await notification.update({
						push_sent: true,
						push_sent_at: new Date()
					});
				}

				return { success: true, userId: member.user_id, pushResult };
			} catch (error) {
				logger.error('Error sending message notification to user', {
					userId: member.user_id,
					messageId: message.id,
					error: error.message
				});
				return { success: false, userId: member.user_id, error: error.message };
			}
		});

		const results = await Promise.all(notificationPromises);
		const successCount = results.filter(r => r.success).length;

		logger.info('Message notifications sent', {
			messageId: message.id,
			conversationId: message.conversation_id,
			senderId: message.sender_id,
			totalMembers: conversationMembers.length,
			notificationsSent: successCount,
			results
		});

		return {
			success: true,
			notificationsSent: successCount,
			totalMatchingUsers: usersToNotify.length,
			results
		};
	} catch (error) {
		logger.error('Error in sendMessageNotification', {
			messageId: message.id,
			error: error.message,
			stack: error.stack
		});
		return { success: false, error: error.message };
	}
}

module.exports = { 
	sendPushToUser, 
	saveOrUpdateToken, 
	sendPostNotificationToAllUsers, 
	sendFeedPostNotificationToAllUsers,
	sendMessageNotification
};


