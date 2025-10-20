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
	// Check if user has any active sessions - if all sessions are revoked/inactive, 
	// it indicates the user's tokens are blacklisted and they shouldn't receive notifications
	const activeSessionsCount = await db.SessionLog.count({
		where: {
			user_id: userId,
			is_active: true
		}
	});

	// If user has no active sessions, their tokens are likely blacklisted (e.g., after logout or suspension)
	if (activeSessionsCount === 0) {
		logger.info('Skipping notification for user with blacklisted tokens (no active sessions)', { userId });
		return { successCount: 0, failureCount: 0, results: [] };
	}

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
		// Early return if no required skill specified - can't match any users
		if (!post.required_skill_id) {
			logger.info('No required skill specified for post, skipping notifications', {
				postId: post.id,
				requiredSkillId: post.required_skill_id
			});
			return { success: true, notificationsSent: 0, message: 'No required skill specified' };
		}

		// Log post creator ID for debugging
		logger.info('Sending post notifications', {
			postId: post.id,
			postCreatorId: post.user_id,
			requiredSkillId: post.required_skill_id
		});

		// OPTIMIZED: Use database-level filtering instead of loading all users
		// RECOMMENDATION: Add database indexes for optimal performance:
		// 1. CREATE INDEX idx_user_profile_looking_skills_gist ON user_profile USING GIN (looking_skills);
		// 2. CREATE INDEX idx_notification_settings_push ON notification_settings (user_id, push_notification) WHERE push_notification = true;
		// 3. Ensure user_profile.user_id has proper foreign key index
		let usersToNotify = [];
		
		try {
			// Attempt optimized database query with PostgreSQL JSON operations
			usersToNotify = await db.User.findAll({
				attributes: ['id', 'name'],
				where: {
					id: {
						[db.Sequelize.Op.ne]: post.user_id // Exclude post creator
					}
				},
				include: [
					{
						model: db.NotificationSettings,
						as: 'notificationSettings',
						attributes: ['push_notification'],
						required: true, // INNER JOIN - only users with notification settings
						where: {
							push_notification: true // Only users with push notifications enabled
						}
					},
					{
						model: db.UserProfile,
						as: 'profile',
						attributes: ['looking_skills'],
						required: true, // INNER JOIN - only users with profiles
						where: {
							// Use PostgreSQL JSON operators to check if looking_skills contains the required skill
							[db.Sequelize.Op.and]: [
								// Check that looking_skills is not null
								db.Sequelize.where(
									db.Sequelize.col('UserProfile.looking_skills'),
									db.Sequelize.Op.ne,
									null
								),
								// Use PostgreSQL JSON operator to check if the array contains an object with matching id
								db.Sequelize.literal(
									`"UserProfile"."looking_skills"::jsonb @> '[{"id": ${post.required_skill_id}}]'::jsonb`
								)
							]
						}
					}
				]
			});

			logger.info('Found users to notify via optimized query', {
				postId: post.id,
				requiredSkillId: post.required_skill_id,
				usersFound: usersToNotify.length
			});

		} catch (dbError) {
			logger.warn('Optimized query failed, falling back to safer approach', {
				postId: post.id,
				error: dbError.message
			});

			// Fallback: Get users with profiles and notification settings, then filter client-side
			// This is better than the original approach but still not as optimal
			const usersWithSettings = await db.User.findAll({
				attributes: ['id', 'name'],
				where: {
					id: {
						[db.Sequelize.Op.ne]: post.user_id
					}
				},
				include: [
					{
						model: db.NotificationSettings,
						as: 'notificationSettings',
						attributes: ['push_notification'],
						required: true,
						where: {
							push_notification: true
						}
					},
					{
						model: db.UserProfile,
						as: 'profile',
						attributes: ['looking_skills'],
						required: true
					}
				]
			});

			// Client-side filtering for skill matching (fallback)
			usersToNotify = usersWithSettings.filter(user => {
				if (!user.profile || !user.profile.looking_skills) {
					return false;
				}

				const lookingSkills = user.profile.looking_skills;
				if (Array.isArray(lookingSkills)) {
					return lookingSkills.some(skill => skill.id === post.required_skill_id);
				}
				return false;
			});

			logger.info('Found users to notify via fallback query', {
				postId: post.id,
				requiredSkillId: post.required_skill_id,
				usersFound: usersToNotify.length,
				totalChecked: usersWithSettings.length
			});
		}

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

/**
 * Create a notification in the database for feed post likes
 * No push notification is sent - only stored for in-app notification tab
 */
async function createFeedLikeNotification(feedPost, likerUser) {
	try {
		// Don't create notification if user likes their own post
		if (feedPost.user_id === likerUser.id) {
			return { success: true, message: 'No notification for own like' };
		}

		// Create notification in database
		const notification = await db.Notification.create({
			user_id: feedPost.user_id, // Post owner receives the notification
			feed_post_id: feedPost.id,
			type: 'feed_like',
			title: 'New Like',
			body: `${likerUser.name} liked your post`,
			data: {
				feed_post_id: feedPost.id,
				liker_user_id: likerUser.id,
				liker_name: likerUser.name,
				post_content: feedPost.content ? feedPost.content.substring(0, 100) : ''
			},
			push_sent: false // No push notification sent
		});

		logger.info('Feed like notification created', {
			notificationId: notification.id,
			feedPostId: feedPost.id,
			postOwnerId: feedPost.user_id,
			likerUserId: likerUser.id
		});

		return { success: true, notification };
	} catch (error) {
		logger.error('Error creating feed like notification', {
			feedPostId: feedPost.id,
			likerUserId: likerUser.id,
			error: error.message,
			stack: error.stack
		});
		return { success: false, error: error.message };
	}
}

/**
 * Create a notification in the database for feed post comments
 * No push notification is sent - only stored for in-app notification tab
 */
async function createFeedCommentNotification(feedPost, commenterUser, comment) {
	try {
		// Don't create notification if user comments on their own post
		if (feedPost.user_id === commenterUser.id) {
			return { success: true, message: 'No notification for own comment' };
		}

		// Create notification in database
		const notification = await db.Notification.create({
			user_id: feedPost.user_id, // Post owner receives the notification
			feed_post_id: feedPost.id,
			type: 'feed_comment',
			title: 'New Comment',
			body: `${commenterUser.name} commented on your post: ${comment.content.substring(0, 50)}${comment.content.length > 50 ? '...' : ''}`,
			data: {
				feed_post_id: feedPost.id,
				comment_id: comment.id,
				commenter_user_id: commenterUser.id,
				commenter_name: commenterUser.name,
				comment_content: comment.content,
				post_content: feedPost.content ? feedPost.content.substring(0, 100) : ''
			},
			push_sent: false // No push notification sent
		});

		logger.info('Feed comment notification created', {
			notificationId: notification.id,
			feedPostId: feedPost.id,
			postOwnerId: feedPost.user_id,
			commenterUserId: commenterUser.id,
			commentId: comment.id
		});

		return { success: true, notification };
	} catch (error) {
		logger.error('Error creating feed comment notification', {
			feedPostId: feedPost.id,
			commenterUserId: commenterUser.id,
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
	sendMessageNotification,
	createFeedLikeNotification,
	createFeedCommentNotification
};


