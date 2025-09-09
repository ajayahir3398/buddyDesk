/**
 * Swagger Schemas Index
 * Combines all schema modules into a single export
 */

const userSchemas = require('./user.schemas');
const securitySchemas = require('./security.schemas');
const aadhaarSchemas = require('./aadhaar.schemas');
const contentSchemas = require('./content.schemas');
const commonSchemas = require('./common.schemas');

module.exports = {
  ...userSchemas,
  ...securitySchemas,
  ...aadhaarSchemas,
  ...contentSchemas,
  ...commonSchemas,
};