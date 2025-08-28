const admin = require('../config/firebase');
const db = require('../models');

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

module.exports = { sendPushToUser, saveOrUpdateToken };


