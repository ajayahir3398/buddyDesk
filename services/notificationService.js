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
		attributes: ['id', 'fcm_token']
	});

	if (!tokens.length) return { successCount: 0, failureCount: 0, results: [] };

	const registrationTokens = tokens.map(t => t.fcm_token);
	const message = {
		notification: payload.notification || undefined,
		data: payload.data || undefined,
		tokens: registrationTokens
	};

	const response = await admin.messaging().sendEachForMulticast(message);

	// Cleanup invalid tokens
	const invalidTokenIds = [];
	response.responses.forEach((res, idx) => {
		if (!res.success) {
			const code = res.error && res.error.code;
			if (code === 'messaging/registration-token-not-registered' || code === 'messaging/invalid-registration-token') {
				invalidTokenIds.push(tokens[idx].id);
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
}

async function sendPostNotificationToMatchingUsers(post) {
	try {
		// If post doesn't have a required skill, no notifications to send
		if (!post.required_skill_id) {
			return { success: true, notificationsSent: 0 };
		}

		// Find users whose looking_skills contain the post's required_skill_id
		const matchingUsers = await db.UserProfile.findAll({
			where: {
				looking_skills: {
					[db.Sequelize.Op.contains]: [post.required_skill_id]
				}
			},
			include: [{
				model: db.User,
				as: 'user',
				attributes: ['id', 'name']
			}]
		});

		// Filter out the post creator from receiving notification
		const usersToNotify = matchingUsers.filter(profile => 
			profile.user && profile.user.id !== post.user_id
		);

		if (usersToNotify.length === 0) {
			return { success: true, notificationsSent: 0 };
		}

		// Get skill name for notification
		const skill = await db.Skill.findByPk(post.required_skill_id);
		const skillName = skill ? skill.name : 'a skill you\'re looking for';

		// Create notifications and send push notifications
		const notificationPromises = usersToNotify.map(async (userProfile) => {
			try {
				// Create notification in database
				const notification = await db.Notification.create({
					user_id: userProfile.user.id,
					post_id: post.id,
					type: 'post',
					title: 'New Post Match!',
					body: `A new post requiring ${skillName} has been posted: "${post.title}"`,
					data: {
						post_id: post.id,
						skill_id: post.required_skill_id,
						skill_name: skillName
					}
				});

				// Send push notification
				const pushResult = await sendPushToUser(userProfile.user.id, {
					notification: {
						title: 'New Post Match!',
						body: `A new post requiring ${skillName} has been posted: "${post.title}"`
					},
					data: {
						post_id: post.id.toString(),
						skill_id: post.required_skill_id.toString(),
						notification_type: 'post_match'
					}
				});

				// Update notification with push status
				if (pushResult.successCount > 0) {
					await notification.update({
						push_sent: true,
						push_sent_at: new Date()
					});
				}

				return { success: true, userId: userProfile.user.id, pushResult };
			} catch (error) {
				logger.error('Error sending notification to user', {
					userId: userProfile.user.id,
					postId: post.id,
					error: error.message
				});
				return { success: false, userId: userProfile.user.id, error: error.message };
			}
		});

		const results = await Promise.all(notificationPromises);
		const successCount = results.filter(r => r.success).length;

		logger.info('Post notifications sent', {
			postId: post.id,
			totalUsers: usersToNotify.length,
			successCount,
			failureCount: results.length - successCount
		});

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

module.exports = { sendPushToUser, saveOrUpdateToken, sendPostNotificationToMatchingUsers };


