const { validationResult } = require('express-validator');
const notificationService = require('../services/notificationService');

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

module.exports = { saveToken, sendTest };


