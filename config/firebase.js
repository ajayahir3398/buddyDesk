const admin = require('firebase-admin');

// Prefer env JSON (base64) to avoid committing keys
const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

let initialized = false;

function initializeFirebaseAdmin() {
	if (initialized) return admin;
	if (admin.apps && admin.apps.length > 0) {
		initialized = true;
		return admin;
	}

	if (!serviceAccountJson) {
		throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON env var is required');
	}

	// let credentials;
	// try {
	// 	credentials = JSON.parse(Buffer.from(serviceAccountJson, 'base64').toString('utf8'));
	// } catch (err) {
	// 	throw new Error('Invalid FIREBASE_SERVICE_ACCOUNT_JSON. Must be base64-encoded JSON');
	// }

	// admin.initializeApp({
	// 	credential: admin.credential.cert(credentials)
	// });

	initialized = true;
	return admin;
}

module.exports = initializeFirebaseAdmin();


