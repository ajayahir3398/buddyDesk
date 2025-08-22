const { body, param, query } = require('express-validator');

/**
 * Chat Validation Middleware
 * Contains validation rules for all chat-related endpoints
 */

/**
 * Validation for creating a conversation
 */
const validateCreateConversation = [
  body('type')
    .isIn(['private', 'group'])
    .withMessage('Type must be either "private" or "group"'),
  
  body('name')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Name must be between 1 and 100 characters')
    .trim(),
  
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters')
    .trim(),
  
  body('memberIds')
    .isArray({ min: 0, max: 50 })
    .withMessage('Member IDs must be an array with maximum 50 members'),
  
  body('memberIds.*')
    .isInt({ min: 1 })
    .withMessage('Each member ID must be a positive integer'),
  
  // Custom validation for private conversations
  body().custom((value) => {
    if (value.type === 'private' && (!value.memberIds || value.memberIds.length !== 1)) {
      throw new Error('Private conversations must have exactly one other member');
    }
    if (value.type === 'group' && (!value.name || value.name.trim().length === 0)) {
      throw new Error('Group conversations must have a name');
    }
    return true;
  })
];

/**
 * Validation for sending a message
 */
const validateSendMessage = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Conversation ID must be a positive integer'),
  
  body('content')
    .optional()
    .isLength({ min: 1, max: 4000 })
    .withMessage('Content must be between 1 and 4000 characters')
    .trim(),
  
  body('messageType')
    .optional()
    .isIn(['text', 'image', 'video', 'audio', 'file', 'system'])
    .withMessage('Message type must be one of: text, image, video, audio, file, system'),
  
  body('replyToMessageId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Reply to message ID must be a positive integer'),
  
  body('forwardFromMessageId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Forward from message ID must be a positive integer'),
  
  body('attachmentUrl')
    .optional()
    .isURL()
    .withMessage('Attachment URL must be a valid URL'),
  
  body('attachmentName')
    .optional()
    .isLength({ min: 1, max: 255 })
    .withMessage('Attachment name must be between 1 and 255 characters')
    .trim(),
  
  body('attachmentSize')
    .optional()
    .isInt({ min: 0, max: 100000000 }) // 100MB max
    .withMessage('Attachment size must be between 0 and 100MB'),
  
  body('attachmentMimeType')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Attachment MIME type must be between 1 and 100 characters')
    .trim(),
  
  // Custom validation to ensure either content or attachment is provided
  body().custom((value) => {
    if (!value.content && !value.attachmentUrl) {
      throw new Error('Either content or attachment must be provided');
    }
    return true;
  })
];

/**
 * Validation for conversation ID parameter
 */
const validateConversationId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Conversation ID must be a positive integer')
];

/**
 * Validation for message ID parameter
 */
const validateMessageId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Message ID must be a positive integer')
];

/**
 * Validation for user ID parameter
 */
const validateUserId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('User ID must be a positive integer')
];

/**
 * Validation for notification ID parameter
 */
const validateNotificationId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Notification ID must be a positive integer')
];

/**
 * Validation for pagination parameters
 */
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Page must be a positive integer between 1 and 1000'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be a positive integer between 1 and 100')
];

/**
 * Validation for search query
 */
const validateSearch = [
  query('q')
    .isLength({ min: 2, max: 100 })
    .withMessage('Search query must be between 2 and 100 characters')
    .trim(),
  
  query('conversation_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Conversation ID must be a positive integer')
];

/**
 * Validation for file upload
 */
const validateFileUpload = [
  body('messageType')
    .isIn(['image', 'video', 'audio', 'file'])
    .withMessage('Message type must be one of: image, video, audio, file'),
  
  body('conversationId')
    .isInt({ min: 1 })
    .withMessage('Conversation ID must be a positive integer')
];

/**
 * Validation for updating conversation
 */
const validateUpdateConversation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Conversation ID must be a positive integer'),
  
  body('name')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Name must be between 1 and 100 characters')
    .trim(),
  
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters')
    .trim(),
  
  body('avatarUrl')
    .optional()
    .isURL()
    .withMessage('Avatar URL must be a valid URL')
];

/**
 * Validation for adding members to conversation
 */
const validateAddMembers = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Conversation ID must be a positive integer'),
  
  body('memberIds')
    .isArray({ min: 1, max: 20 })
    .withMessage('Member IDs must be an array with 1-20 members'),
  
  body('memberIds.*')
    .isInt({ min: 1 })
    .withMessage('Each member ID must be a positive integer')
];

/**
 * Validation for removing members from conversation
 */
const validateRemoveMembers = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Conversation ID must be a positive integer'),
  
  body('memberIds')
    .isArray({ min: 1, max: 20 })
    .withMessage('Member IDs must be an array with 1-20 members'),
  
  body('memberIds.*')
    .isInt({ min: 1 })
    .withMessage('Each member ID must be a positive integer')
];

/**
 * Validation for updating member role
 */
const validateUpdateMemberRole = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Conversation ID must be a positive integer'),
  
  param('memberId')
    .isInt({ min: 1 })
    .withMessage('Member ID must be a positive integer'),
  
  body('role')
    .isIn(['admin', 'member'])
    .withMessage('Role must be either "admin" or "member"')
];

/**
 * Validation for editing a message
 */
const validateEditMessage = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Message ID must be a positive integer'),
  
  body('content')
    .isLength({ min: 1, max: 4000 })
    .withMessage('Content must be between 1 and 4000 characters')
    .trim()
];

/**
 * Validation for deleting a message
 */
const validateDeleteMessage = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Message ID must be a positive integer')
];

/**
 * Rate limiting validation
 */
const validateRateLimit = [
  // This would typically be handled by rate limiting middleware
  // but we can add custom validation here if needed
  body().custom((value, { req }) => {
    // Custom rate limiting logic can be added here
    // For example, checking if user has exceeded message limits
    return true;
  })
];

/**
 * Sanitization middleware for chat content
 */
const sanitizeChatContent = [
  body('content')
    .optional()
    .escape() // Escape HTML entities
    .trim(),
  
  body('name')
    .optional()
    .escape()
    .trim(),
  
  body('description')
    .optional()
    .escape()
    .trim()
];

module.exports = {
  validateCreateConversation,
  validateSendMessage,
  validateConversationId,
  validateMessageId,
  validateUserId,
  validateNotificationId,
  validatePagination,
  validateSearch,
  validateFileUpload,
  validateUpdateConversation,
  validateAddMembers,
  validateRemoveMembers,
  validateUpdateMemberRole,
  validateEditMessage,
  validateDeleteMessage,
  validateRateLimit,
  sanitizeChatContent
};