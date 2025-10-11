const chatService = require('../services/chatService');
const logger = require('../utils/logger');
const { validationResult } = require('express-validator');

/**
 * Chat Controller - Handles HTTP requests for chat functionality
 */
class ChatController {
  /**
   * Create a new conversation
   * POST /api/chat/conversations
   */
  async createConversation(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { type, name, description, memberIds } = req.body;
      const createdBy = req.user.id;

      const result = await chatService.createConversation({
        createdBy,
        type,
        name,
        description,
        memberIds
      });

      if (result.success) {
        res.status(201).json({
          success: true,
          message: result.message || 'Conversation created successfully',
          data: result.data
        });
      } else {
        logger.error('Service returned error:', result.error);
        res.status(400).json({
          success: false,
          message: result.error || 'Failed to create conversation'
        });
      }
    } catch (error) {
      logger.error('Error in createConversation controller:', error);
      
      // Handle specific error types
      let statusCode = 500;
      let message = 'Internal server error';
      
      if (error.message.includes('Invalid') || error.message.includes('must have exactly')) {
        statusCode = 400;
        message = error.message;
      } else if (error.message.includes('not found')) {
        statusCode = 404;
        message = error.message;
      }
      
      res.status(statusCode).json({
        success: false,
        message: message
      });
    }
  }

  /**
   * Get user's conversations
   * GET /api/chat/conversations
   */
  async getUserConversations(req, res) {
    try {
      const userId = req.user.id;
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const conversations = await chatService.getUserConversations(userId, baseUrl);

      res.json({
        success: true,
        message: 'Conversations retrieved successfully',
        data: conversations
      });
    } catch (error) {
      logger.error('Error in getUserConversations:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get conversation by ID
   * GET /api/chat/conversations/:id
   */
  async getConversationById(req, res) {
    try {
      const conversationId = parseInt(req.params.id);
      const userId = req.user.id;
      const baseUrl = `${req.protocol}://${req.get('host')}`;

      // Check if user is member of conversation
      const isMember = await chatService.isConversationMember(conversationId, userId);
      if (!isMember) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You are not a member of this conversation.'
        });
      }

      const conversation = await chatService.getConversationById(conversationId, baseUrl);
      
      if (!conversation) {
        return res.status(404).json({
          success: false,
          message: 'Conversation not found'
        });
      }

      res.json({
        success: true,
        message: 'Conversation retrieved successfully',
        data: conversation
      });
    } catch (error) {
      logger.error('Error in getConversationById:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get conversation messages
   * GET /api/chat/conversations/:id/messages
   */
  async getConversationMessages(req, res) {
    try {
      const conversationId = parseInt(req.params.id);
      const userId = req.user.id;
      const page = parseInt(req.query.page) || 1;
      const limit = Math.min(parseInt(req.query.limit) || 50, 100); // Max 100 messages per request
      const baseUrl = `${req.protocol}://${req.get('host')}`;

      const result = await chatService.getConversationMessages(conversationId, userId, page, limit, baseUrl);

      if (result.success) {
        res.json({
          success: true,
          message: 'Messages retrieved successfully',
          data: result.data
        });
      } else {
        res.status(403).json({
          success: false,
          message: result.error
        });
      }
    } catch (error) {
      logger.error('Error in getConversationMessages:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Send a message (REST endpoint - for file uploads, etc.)
   * POST /api/chat/conversations/:id/messages
   */
  async sendMessage(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const conversationId = parseInt(req.params.id);
      const senderId = req.user.id;
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const {
        content,
        messageType,
        replyToMessageId,
        forwardFromMessageId,
        attachmentUrl,
        attachmentName,
        attachmentSize,
        attachmentMimeType,
        metadata
      } = req.body;

      const result = await chatService.sendMessage({
        senderId,
        conversationId,
        content,
        messageType,
        replyToMessageId,
        forwardFromMessageId,
        attachmentUrl,
        attachmentName,
        attachmentSize,
        attachmentMimeType,
        metadata
      }, baseUrl);

      if (result.success) {
        // Emit real-time event if Socket.io is available
        if (req.app.get('io')) {
          const io = req.app.get('io');
          
          // Emit message to conversation members
          io.to(`conversation_${conversationId}`).emit('new_message', result.data);
          
          // Emit conversation update to refresh conversation lists
          io.to(`conversation_${conversationId}`).emit('conversation_updated', {
            conversationId: conversationId,
            lastMessage: {
              id: result.data.id,
              content: result.data.content,
              message_type: result.data.message_type,
              created_at: result.data.created_at,
              sender_id: senderId,
              sender: {
                id: result.data.sender.id,
                name: result.data.sender.name,
                profile: result.data.sender.profile
              }
            },
            last_message_at: new Date()
          });
        }

        res.status(201).json({
          success: true,
          message: 'Message sent successfully',
          data: result.data
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.error
        });
      }
    } catch (error) {
      logger.error('Error in sendMessage:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Mark message as read
   * PUT /api/chat/messages/:id/read
   */
  async markMessageAsRead(req, res) {
    try {
      const messageId = parseInt(req.params.id);
      const userId = req.user.id;

      const success = await chatService.markMessageAsRead(messageId, userId);

      if (success) {
        res.json({
          success: true,
          message: 'Message marked as read'
        });
      } else {
        res.status(400).json({
          success: false,
          message: 'Failed to mark message as read'
        });
      }
    } catch (error) {
      logger.error('Error in markMessageAsRead:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Mark all messages in a conversation as read (bulk operation)
   * PUT /api/chat/conversations/:id/read
   */
  async markConversationAsRead(req, res) {
    try {
      const conversationId = parseInt(req.params.id);
      const userId = req.user.id;

      // Check if user is member of conversation
      const isMember = await chatService.isConversationMember(conversationId, userId);
      if (!isMember) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You are not a member of this conversation.'
        });
      }

      const result = await chatService.markConversationAsRead(conversationId, userId);

      if (result.success) {
        // Emit real-time event if Socket.io is available
        if (req.app.get('io')) {
          req.app.get('io').to(`conversation_${conversationId}`).emit('conversation_read', {
            conversationId,
            userId,
            readAt: new Date(),
            messageCount: result.count
          });
        }

        res.json({
          success: true,
          message: result.message,
          data: {
            conversationId,
            messageCount: result.count
          }
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.error || 'Failed to mark messages as read'
        });
      }
    } catch (error) {
      logger.error('Error in markConversationAsRead:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Search messages
   * GET /api/chat/search
   */
  async searchMessages(req, res) {
    try {
      const { q: query, conversation_id: conversationId } = req.query;
      const userId = req.user.id;
      const baseUrl = `${req.protocol}://${req.get('host')}`;

      if (!query || query.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Search query must be at least 2 characters long'
        });
      }

      const result = await chatService.searchMessages(
        userId,
        query.trim(),
        conversationId ? parseInt(conversationId) : null,
        baseUrl
      );

      if (result.success) {
        res.json({
          success: true,
          message: 'Search completed successfully',
          data: result.data
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.error
        });
      }
    } catch (error) {
      logger.error('Error in searchMessages:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get user's online status
   * GET /api/chat/users/:id/status
   */
  async getUserStatus(req, res) {
    try {
      const userId = parseInt(req.params.id);
      const db = require('../models');

      const user = await db.User.findByPk(userId, {
        attributes: ['id', 'name', 'is_online', 'last_seen'],
        include: [{
          model: db.UserProfile,
          as: 'profile',
          attributes: ['image_path']
        }]
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        message: 'User status retrieved successfully',
        data: {
          id: user.id,
          name: user.name,
          is_online: user.is_online,
          last_seen: user.last_seen,
          profile: user.profile
        }
      });
    } catch (error) {
      logger.error('Error in getUserStatus:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get typing status for a conversation
   * GET /api/chat/conversations/:id/typing
   */
  async getTypingStatus(req, res) {
    try {
      const conversationId = parseInt(req.params.id);
      const userId = req.user.id;
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const db = require('../models');

      // Check if user is member of conversation
      const isMember = await chatService.isConversationMember(conversationId, userId);
      if (!isMember) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You are not a member of this conversation.'
        });
      }

      const typingUsers = await db.TypingStatus.findAll({
        where: {
          conversation_id: conversationId,
          is_typing: true,
          user_id: { [db.Sequelize.Op.ne]: userId } // Exclude current user
        },
        include: [{
          model: db.User,
          as: 'user',
          attributes: ['id', 'name'],
          include: [{
            model: db.UserProfile,
            as: 'profile',
            attributes: ['image_path']
          }]
        }]
      });

      res.json({
        success: true,
        message: 'Typing status retrieved successfully',
        data: typingUsers.map(ts => {
          const userData = {
            userId: ts.user.id,
            userName: ts.user.name,
            startedTypingAt: ts.started_typing_at
          };
          
          // Add image URL if profile exists
          if (ts.user.profile && ts.user.profile.image_path) {
            userData.profile = {
              image_path: ts.user.profile.image_path,
              image_url: `${baseUrl}/api/files/${ts.user.profile.image_path}`
            };
          }
          
          return userData;
        })
      });
    } catch (error) {
      logger.error('Error in getTypingStatus:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get user's notifications
   * GET /api/chat/notifications
   */
  async getUserNotifications(req, res) {
    try {
      const userId = req.user.id;
      const page = parseInt(req.query.page) || 1;
      const limit = Math.min(parseInt(req.query.limit) || 20, 50);
      const offset = (page - 1) * limit;
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const db = require('../models');

      const { count, rows: notifications } = await db.Notification.findAndCountAll({
        where: { user_id: userId },
        include: [{
          model: db.Message,
          as: 'message',
          include: [{
            model: db.User,
            as: 'sender',
            attributes: ['id', 'name'],
            include: [{
              model: db.UserProfile,
              as: 'profile',
              attributes: ['image_path']
            }]
          }]
        }, {
          model: db.Conversation,
          as: 'conversation',
          attributes: ['id', 'name', 'type']
        }],
        order: [['created_at', 'DESC']],
        limit,
        offset
      });

      // Add image URLs to notification senders
      const notificationsWithUrls = notifications.map(notification => {
        const notificationData = notification.toJSON ? notification.toJSON() : notification;
        if (notificationData.message && notificationData.message.sender && notificationData.message.sender.profile && notificationData.message.sender.profile.image_path) {
          notificationData.message.sender.profile.image_url = `${baseUrl}/api/files/${notificationData.message.sender.profile.image_path}`;
        }
        return notificationData;
      });

      res.json({
        success: true,
        message: 'Notifications retrieved successfully',
        data: {
          notifications: notificationsWithUrls,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(count / limit),
            totalNotifications: count,
            hasNextPage: page < Math.ceil(count / limit),
            hasPreviousPage: page > 1
          }
        }
      });
    } catch (error) {
      logger.error('Error in getUserNotifications:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Mark notification as read
   * PUT /api/chat/notifications/:id/read
   */
  async markNotificationAsRead(req, res) {
    try {
      const notificationId = parseInt(req.params.id);
      const userId = req.user.id;
      const db = require('../models');

      const [updatedRows] = await db.Notification.update(
        {
          is_read: true,
          read_at: new Date()
        },
        {
          where: {
            id: notificationId,
            user_id: userId
          }
        }
      );

      if (updatedRows > 0) {
        res.json({
          success: true,
          message: 'Notification marked as read'
        });
      } else {
        res.status(404).json({
          success: false,
          message: 'Notification not found'
        });
      }
    } catch (error) {
      logger.error('Error in markNotificationAsRead:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get conversation statistics
   * GET /api/chat/conversations/:id/stats
   */
  async getConversationStats(req, res) {
    try {
      const conversationId = parseInt(req.params.id);
      const userId = req.user.id;
      const db = require('../models');

      // Check if user is member of conversation
      const isMember = await chatService.isConversationMember(conversationId, userId);
      if (!isMember) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You are not a member of this conversation.'
        });
      }

      // Get message count
      const messageCount = await db.Message.count({
        where: {
          conversation_id: conversationId,
          is_deleted: false
        }
      });

      // Get member count
      const memberCount = await db.ConversationMember.count({
        where: {
          conversation_id: conversationId,
          left_at: null
        }
      });

      // Get unread message count for current user
      const unreadCount = await db.MessageStatus.count({
        where: {
          user_id: userId,
          status: { [db.Sequelize.Op.ne]: 'read' }
        },
        include: [{
          model: db.Message,
          as: 'message',
          where: {
            conversation_id: conversationId,
            is_deleted: false
          }
        }]
      });

      res.json({
        success: true,
        message: 'Conversation statistics retrieved successfully',
        data: {
          messageCount,
          memberCount,
          unreadCount
        }
      });
    } catch (error) {
      logger.error('Error in getConversationStats:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}

module.exports = new ChatController();