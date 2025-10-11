const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const authMiddleware = require('../middleware/authMiddleware');
const {
  validateCreateConversation,
  validateSendMessage,
  validateConversationId,
  validateMessageId,
  validateUserId,
  validateNotificationId,
  validatePagination,
  validateSearch,
  sanitizeChatContent
} = require('../middleware/chatValidation');
const {
  messageRateLimit,
  conversationRateLimit,
  searchRateLimit,
  generalChatRateLimit
} = require('../middleware/chatRateLimit');

/**
 * Chat Routes
 * All routes require authentication
 */

// Apply general rate limiting to all chat routes
router.use(generalChatRateLimit);

// Apply authentication middleware to all routes
router.use(authMiddleware);




router.post('/conversations', 
  conversationRateLimit,
  validateCreateConversation,
  sanitizeChatContent,
  chatController.createConversation
);


router.get('/conversations', chatController.getUserConversations);


router.get('/conversations/:id', 
  validateConversationId,
  chatController.getConversationById
);


router.get('/conversations/:id/messages', 
  validateConversationId,
  validatePagination,
  chatController.getConversationMessages
);


router.post('/conversations/:id/messages', 
  messageRateLimit,
  validateSendMessage,
  sanitizeChatContent,
  chatController.sendMessage
);


router.get('/conversations/:id/stats', 
  validateConversationId,
  chatController.getConversationStats
);


router.get('/conversations/:id/typing', 
  validateConversationId,
  chatController.getTypingStatus
);


router.put('/messages/:id/read', 
  validateMessageId,
  chatController.markMessageAsRead
);


router.put('/conversations/:id/read',
  validateConversationId,
  chatController.markConversationAsRead
);


router.get('/search', 
  searchRateLimit,
  validateSearch,
  chatController.searchMessages
);


router.get('/users/:id/status', 
  validateUserId,
  chatController.getUserStatus
);


router.get('/notifications', 
  validatePagination,
  chatController.getUserNotifications
);


router.put('/notifications/:id/read', 
  validateNotificationId,
  chatController.markNotificationAsRead
);

module.exports = router;