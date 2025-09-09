/**
 * Paths Index
 * Combines all API path modules into a single export
 */

const userPaths = require('./user.paths');
const aadhaarPaths = require('./aadhaar.paths');
const chatPaths = require('./chat.paths');
const skillsPaths = require('./skills.paths');
const postsPaths = require('./posts.paths');
const notificationsPaths = require('./notifications.paths');
const filesPaths = require('./files.paths');
const securityPaths = require('./security.paths');

module.exports = {
  ...userPaths,
  ...aadhaarPaths,
  ...chatPaths,
  ...skillsPaths,
  ...postsPaths,
  ...notificationsPaths,
  ...filesPaths,
  ...securityPaths,
};