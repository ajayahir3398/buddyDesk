const db = require('../models');
const crypto = require('crypto-js');
const logger = require('../utils/logger');
const { Op } = require('sequelize');

/**
 * Chat Service - Handles all chat-related business logic
 */
class ChatService {
  constructor() {
    this.encryptionKey = process.env.CHAT_ENCRYPTION_KEY || 'default-key-change-in-production';
  }

  /**
   * Encrypt message content
   * @param {string} content - Plain text content
   * @returns {string} Encrypted content
   */
  encryptMessage(content) {
    try {
      return crypto.AES.encrypt(content, this.encryptionKey).toString();
    } catch (error) {
      logger.error('Error encrypting message:', error);
      throw new Error('Failed to encrypt message');
    }
  }

  /**
   * Decrypt message content
   * @param {string} encryptedContent - Encrypted content
   * @returns {string} Decrypted content
   */
  decryptMessage(encryptedContent) {
    try {
      const bytes = crypto.AES.decrypt(encryptedContent, this.encryptionKey);
      return bytes.toString(crypto.enc.Utf8);
    } catch (error) {
      logger.error('Error decrypting message:', error);
      return '[Encrypted Message]';
    }
  }

  /**
   * Create a new conversation
   * @param {Object} data - Conversation data
   * @returns {Object} Result with success status and data
   */
  async createConversation(data) {
    const transaction = await db.sequelize.transaction();
    
    try {
      const { createdBy, type, name, description, memberIds = [] } = data;

      // Validate conversation type
      if (!['private', 'group'].includes(type)) {
        throw new Error('Invalid conversation type');
      }

      // For private conversations, ensure only 2 members
      if (type === 'private' && memberIds.length !== 1) {
        throw new Error('Private conversations must have exactly 2 members');
      }

      // Validate that creator exists
      const creator = await db.User.findByPk(createdBy);
      if (!creator) {
        throw new Error('Creator user not found');
      }

      // Validate that all member IDs exist
      if (memberIds.length > 0) {
        const existingUsers = await db.User.findAll({
          where: { id: memberIds },
          attributes: ['id']
        });
        
        if (existingUsers.length !== memberIds.length) {
          throw new Error('One or more member IDs are invalid');
        }
      }

      // Check if private conversation already exists
      if (type === 'private') {
        const existingConversation = await this.findPrivateConversation(createdBy, memberIds[0]);
        if (existingConversation) {
          await transaction.rollback();
          return {
            success: true,
            data: existingConversation,
            message: 'Conversation already exists'
          };
        }
      }

      // Create conversation
      const conversation = await db.Conversation.create({
        type,
        name: type === 'group' ? name : null,
        description: type === 'group' ? description : null,
        created_by: createdBy,
        is_active: true,
        last_message_at: new Date()
      }, { transaction });

      // Add creator as admin
      await db.ConversationMember.create({
        conversation_id: conversation.id,
        user_id: createdBy,
        role: 'admin',
        joined_at: new Date()
      }, { transaction });

      // Add other members
      const memberPromises = memberIds.map(userId => 
        db.ConversationMember.create({
          conversation_id: conversation.id,
          user_id: userId,
          role: 'member',
          joined_at: new Date()
        }, { transaction })
      );

      await Promise.all(memberPromises);

      // Fetch complete conversation with members
      const completeConversation = await this.getConversationById(conversation.id);

      await transaction.commit();
      
      return {
        success: true,
        data: completeConversation
      };
    } catch (error) {
      await transaction.rollback();
      logger.error('Error creating conversation:', {
        message: error.message,
        name: error.name,
        stack: error.stack,
        data: data
      });
      
      // Provide user-friendly error messages
      let userMessage = 'Failed to create conversation';
      
      if (error.name === 'SequelizeValidationError') {
        userMessage = `Invalid data: ${error.errors?.map(e => e.message).join(', ') || 'Validation failed'}`;
      } else if (error.name === 'SequelizeForeignKeyConstraintError') {
        userMessage = 'One or more member IDs are invalid';
      } else if (error.name === 'SequelizeUniqueConstraintError') {
        userMessage = 'Conversation with these members already exists';
      } else if (error.name === 'SequelizeDatabaseError') {
        userMessage = 'Database operation failed. Please try again';
      } else if (error.message.includes('transaction')) {
        userMessage = 'Database transaction failed. Please try again';
      } else if (error.message.includes('Invalid conversation type')) {
        userMessage = error.message;
      } else if (error.message.includes('Private conversations must have exactly')) {
        userMessage = error.message;
      } else if (error.message.includes('Creator user not found')) {
        userMessage = error.message;
      } else if (error.message.includes('One or more member IDs are invalid')) {
        userMessage = error.message;
      } else {
        // Log the actual error for debugging but return a generic message
        logger.error('Unhandled error in createConversation:', error);
        userMessage = `Failed to create conversation: ${error.message}`;
      }
      
      return {
        success: false,
        error: userMessage
      };
    }
  }

  /**
   * Find existing private conversation between two users
   * @param {number} userId1 - First user ID
   * @param {number} userId2 - Second user ID
   * @returns {Object|null} Conversation or null
   */
  async findPrivateConversation(userId1, userId2) {
    try {
      const conversation = await db.Conversation.findOne({
        where: { type: 'private' },
        include: [{
          model: db.ConversationMember,
          as: 'members',
          where: {
            user_id: { [Op.in]: [userId1, userId2] }
          },
          include: [{
            model: db.User,
            as: 'user',
            attributes: ['id', 'name', 'email', 'is_online', 'last_seen']
          }]
        }],
        having: db.sequelize.literal('COUNT("members"."id") = 2')
      });

      return conversation;
    } catch (error) {
      logger.error('Error finding private conversation:', error);
      return null;
    }
  }

  /**
   * Get conversation by ID with members
   * @param {number} conversationId - Conversation ID
   * @returns {Object|null} Conversation with members
   */
  async getConversationById(conversationId) {
    try {
      return await db.Conversation.findByPk(conversationId, {
        include: [{
          model: db.ConversationMember,
          as: 'members',
          include: [{
            model: db.User,
            as: 'user',
            attributes: ['id', 'name', 'email', 'is_online', 'last_seen']
          }]
        }, {
          model: db.User,
          as: 'creator',
          attributes: ['id', 'name', 'email']
        }]
      });
    } catch (error) {
      logger.error('Error getting conversation:', error);
      return null;
    }
  }

  /**
   * Get user's conversations
   * @param {number} userId - User ID
   * @returns {Array} User's conversations
   */
  async getUserConversations(userId) {
    try {
      const conversations = await db.Conversation.findAll({
        include: [{
          model: db.ConversationMember,
          as: 'members',
          where: { user_id: userId },
          include: [{
            model: db.User,
            as: 'user',
            attributes: ['id', 'name', 'email', 'is_online', 'last_seen']
          }]
        }],
        order: [['last_message_at', 'DESC']]
      });

      return conversations;
    } catch (error) {
      logger.error('Error getting user conversations:', error);
      return [];
    }
  }

  /**
   * Check if user is member of conversation
   * @param {number} conversationId - Conversation ID
   * @param {number} userId - User ID
   * @returns {boolean} True if user is member
   */
  async isConversationMember(conversationId, userId) {
    try {
      const member = await db.ConversationMember.findOne({
        where: {
          conversation_id: conversationId,
          user_id: userId,
          left_at: null
        }
      });

      return !!member;
    } catch (error) {
      logger.error('Error checking conversation membership:', error);
      return false;
    }
  }

  /**
   * Send a message
   * @param {Object} data - Message data
   * @returns {Object} Result with success status and data
   */
  async sendMessage(data) {
    const transaction = await db.sequelize.transaction();
    
    try {
      const {
        senderId,
        conversationId,
        content,
        messageType = 'text',
        replyToMessageId,
        forwardFromMessageId,
        attachmentUrl,
        attachmentName,
        attachmentSize,
        attachmentMimeType,
        metadata
      } = data;

      // Verify user is member of conversation
      const isMember = await this.isConversationMember(conversationId, senderId);
      if (!isMember) {
        throw new Error('User is not a member of this conversation');
      }

      // Encrypt content
      const encryptedContent = content ? this.encryptMessage(content) : null;
      const contentPlain = content; // For search purposes

      // Create message
      const message = await db.Message.create({
        conversation_id: conversationId,
        sender_id: senderId,
        content: encryptedContent,
        content_plain: contentPlain,
        message_type: messageType,
        reply_to_message_id: replyToMessageId,
        forward_from_message_id: forwardFromMessageId,
        attachment_url: attachmentUrl,
        attachment_name: attachmentName,
        attachment_size: attachmentSize,
        attachment_mime_type: attachmentMimeType,
        metadata: metadata ? JSON.stringify(metadata) : null,
        is_edited: false,
        is_deleted: false
      }, { transaction });

      // Update conversation last message time
      await db.Conversation.update(
        { last_message_at: new Date() },
        { where: { id: conversationId }, transaction }
      );

      // Create message status for all conversation members
      const members = await db.ConversationMember.findAll({
        where: { conversation_id: conversationId, left_at: null },
        transaction
      });

      const statusPromises = members.map(member => {
        const status = member.user_id === senderId ? 'read' : 'sent';
        const readAt = member.user_id === senderId ? new Date() : null;
        
        return db.MessageStatus.create({
          message_id: message.id,
          user_id: member.user_id,
          status,
          delivered_at: new Date(),
          read_at: readAt
        }, { transaction });
      });

      await Promise.all(statusPromises);

      // Fetch complete message with sender info
      const completeMessage = await db.Message.findByPk(message.id, {
        include: [{
          model: db.User,
          as: 'sender',
          attributes: ['id', 'name', 'email']
        }, {
          model: db.Message,
          as: 'replyToMessage',
          include: [{
            model: db.User,
            as: 'sender',
            attributes: ['id', 'name']
          }]
        }],
        transaction
      });

      // Decrypt content for response
      if (completeMessage.content) {
        completeMessage.dataValues.content = this.decryptMessage(completeMessage.content);
      }

      await transaction.commit();
      
      return {
        success: true,
        data: completeMessage
      };
    } catch (error) {
      await transaction.rollback();
      logger.error('Error sending message:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get conversation messages with pagination
   * @param {number} conversationId - Conversation ID
   * @param {number} userId - User ID (for permission check)
   * @param {number} page - Page number
   * @param {number} limit - Messages per page
   * @returns {Object} Messages with pagination info
   */
  async getConversationMessages(conversationId, userId, page = 1, limit = 50) {
    try {
      // Verify user is member of conversation
      const isMember = await this.isConversationMember(conversationId, userId);
      if (!isMember) {
        throw new Error('User is not a member of this conversation');
      }

      const offset = (page - 1) * limit;

      const { count, rows: messages } = await db.Message.findAndCountAll({
        where: {
          conversation_id: conversationId,
          is_deleted: false
        },
        include: [{
          model: db.User,
          as: 'sender',
          attributes: ['id', 'name', 'email']
        }, {
          model: db.Message,
          as: 'replyToMessage',
          include: [{
            model: db.User,
            as: 'sender',
            attributes: ['id', 'name']
          }]
        }, {
          model: db.MessageStatus,
          as: 'statuses',
          include: [{
            model: db.User,
            as: 'user',
            attributes: ['id', 'name']
          }]
        }],
        order: [['created_at', 'DESC']],
        limit,
        offset
      });

      // Decrypt message contents
      const decryptedMessages = messages.map(message => {
        const messageData = message.toJSON();
        if (messageData.content) {
          messageData.content = this.decryptMessage(messageData.content);
        }
        return messageData;
      });

      return {
        success: true,
        data: {
          messages: decryptedMessages.reverse(), // Reverse to show oldest first
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(count / limit),
            totalMessages: count,
            hasNextPage: page < Math.ceil(count / limit),
            hasPreviousPage: page > 1
          }
        }
      };
    } catch (error) {
      logger.error('Error getting conversation messages:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Mark message as read
   * @param {number} messageId - Message ID
   * @param {number} userId - User ID
   * @returns {boolean} Success status
   */
  async markMessageAsRead(messageId, userId) {
    try {
      await db.MessageStatus.update(
        {
          status: 'read',
          read_at: new Date()
        },
        {
          where: {
            message_id: messageId,
            user_id: userId
          }
        }
      );

      return true;
    } catch (error) {
      logger.error('Error marking message as read:', error);
      return false;
    }
  }

  /**
   * Update typing status
   * @param {number} conversationId - Conversation ID
   * @param {number} userId - User ID
   * @param {boolean} isTyping - Typing status
   * @returns {boolean} Success status
   */
  async updateTypingStatus(conversationId, userId, isTyping) {
    try {
      const now = new Date();
      
      await db.TypingStatus.upsert({
        conversation_id: conversationId,
        user_id: userId,
        is_typing: isTyping,
        started_typing_at: isTyping ? now : null,
        last_typing_at: now
      });

      return true;
    } catch (error) {
      logger.error('Error updating typing status:', error);
      return false;
    }
  }

  /**
   * Clear all typing statuses for a user
   * @param {number} userId - User ID
   * @returns {boolean} Success status
   */
  async clearUserTypingStatuses(userId) {
    try {
      await db.TypingStatus.update(
        { is_typing: false },
        { where: { user_id: userId } }
      );

      return true;
    } catch (error) {
      logger.error('Error clearing typing statuses:', error);
      return false;
    }
  }

  /**
   * Send notifications for a new message
   * @param {Object} message - Message object
   * @returns {boolean} Success status
   */
  async sendNotificationsForMessage(message) {
    try {
      // Get conversation members who are offline
      const members = await db.ConversationMember.findAll({
        where: {
          conversation_id: message.conversation_id,
          user_id: { [Op.ne]: message.sender_id },
          left_at: null
        },
        include: [{
          model: db.User,
          as: 'user',
          where: { is_online: false }
        }]
      });

      // Create notifications for offline users
      const notificationPromises = members.map(member => 
        db.Notification.create({
          user_id: member.user_id,
          message_id: message.id,
          conversation_id: message.conversation_id,
          type: 'message',
          title: `New message from ${message.sender.name}`,
          body: message.content_plain || 'Sent an attachment',
          data: JSON.stringify({
            conversationId: message.conversation_id,
            messageId: message.id
          }),
          is_seen: false,
          is_read: false,
          push_sent: false
        })
      );

      await Promise.all(notificationPromises);
      
      return true;
    } catch (error) {
      logger.error('Error sending notifications:', error);
      return false;
    }
  }

  /**
   * Search messages in conversations
   * @param {number} userId - User ID
   * @param {string} query - Search query
   * @param {number} conversationId - Optional conversation ID to limit search
   * @returns {Object} Search results
   */
  async searchMessages(userId, query, conversationId = null) {
    try {
      // Get user's conversation IDs
      const userConversations = await db.ConversationMember.findAll({
        where: { user_id: userId, left_at: null },
        attributes: ['conversation_id']
      });

      const conversationIds = userConversations.map(cm => cm.conversation_id);
      
      if (conversationIds.length === 0) {
        return { success: true, data: [] };
      }

      const whereClause = {
        conversation_id: conversationId ? conversationId : { [Op.in]: conversationIds },
        content_plain: { [Op.iLike]: `%${query}%` },
        is_deleted: false
      };

      const messages = await db.Message.findAll({
        where: whereClause,
        include: [{
          model: db.User,
          as: 'sender',
          attributes: ['id', 'name', 'email']
        }, {
          model: db.Conversation,
          as: 'conversation',
          attributes: ['id', 'name', 'type']
        }],
        order: [['created_at', 'DESC']],
        limit: 50
      });

      // Decrypt message contents
      const decryptedMessages = messages.map(message => {
        const messageData = message.toJSON();
        if (messageData.content) {
          messageData.content = this.decryptMessage(messageData.content);
        }
        return messageData;
      });

      return {
        success: true,
        data: decryptedMessages
      };
    } catch (error) {
      logger.error('Error searching messages:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new ChatService();