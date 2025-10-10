const db = require("../models");
const crypto = require("crypto-js");
const logger = require("../utils/logger");
const { Op } = require("sequelize");
const { sendMessageNotification } = require("./notificationService");

/**
 * Chat Service - Handles all chat-related business logic
 */
class ChatService {
  constructor() {
    this.encryptionKey =
      process.env.CHAT_ENCRYPTION_KEY || "default-key-change-in-production";
  }

  /**
   * Generate full image URL from image path
   * @param {string} imagePath - Relative image path
   * @param {string} baseUrl - Base URL of the application
   * @returns {string|null} Full image URL or null
   */
  generateImageUrl(imagePath, baseUrl) {
    if (!imagePath) return null;
    return `${baseUrl}/api/files/${imagePath}`;
  }

  /**
   * Add image URL to user profile
   * @param {Object} user - User object with profile
   * @param {string} baseUrl - Base URL of the application
   * @returns {Object} User with image_url added to profile
   */
  addImageUrlToUser(user, baseUrl) {
    if (user && user.profile && user.profile.image_path) {
      user.profile.image_url = this.generateImageUrl(user.profile.image_path, baseUrl);
    }
    return user;
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
      logger.error("Error encrypting message:", error);
      throw new Error("Failed to encrypt message");
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
      logger.error("Error decrypting message:", error);
      return "[Encrypted Message]";
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
      if (!["private", "group"].includes(type)) {
        throw new Error("Invalid conversation type");
      }

      // For private conversations, ensure only 2 members
      if (type === "private" && memberIds.length !== 1) {
        throw new Error("Private conversations must have exactly 2 members");
      }

      // Validate that creator exists
      const creator = await db.User.findByPk(createdBy);
      if (!creator) {
        throw new Error("Creator user not found");
      }

      // Validate that all member IDs exist
      if (memberIds.length > 0) {
        const existingUsers = await db.User.findAll({
          where: { id: memberIds },
          attributes: ["id"],
        });

        if (existingUsers.length !== memberIds.length) {
          throw new Error("One or more member IDs are invalid");
        }
      }

      // Check if private conversation already exists
      if (type === "private") {
        const existingConversation = await this.findPrivateConversation(
          createdBy,
          memberIds[0]
        );
        if (existingConversation) {
          await transaction.rollback();
          return {
            success: true,
            data: existingConversation,
            message: "Conversation already exists",
          };
        }
      }

      // Create conversation
      const conversation = await db.Conversation.create(
        {
          type,
          name: type === "group" ? name : null,
          description: type === "group" ? description : null,
          created_by: createdBy,
          is_active: true,
          last_message_at: new Date(),
        },
        { transaction }
      );

      // Add creator as admin
      await db.ConversationMember.create(
        {
          conversation_id: conversation.id,
          user_id: createdBy,
          role: "admin",
          joined_at: new Date(),
        },
        { transaction }
      );

      // Add other members
      const memberPromises = memberIds.map((userId) =>
        db.ConversationMember.create(
          {
            conversation_id: conversation.id,
            user_id: userId,
            role: "member",
            joined_at: new Date(),
          },
          { transaction }
        )
      );

      await Promise.all(memberPromises);

      await transaction.commit();

      // Fetch complete conversation with members after commit
      const completeConversation = await this.getConversationById(
        conversation.id
      );

      return {
        success: true,
        data: completeConversation,
      };
    } catch (error) {
      // Only rollback if transaction is still active
      if (!transaction.finished) {
        await transaction.rollback();
      }
      logger.error("Error creating conversation:", {
        message: error.message,
        name: error.name,
        stack: error.stack,
        data: data,
      });

      // Provide user-friendly error messages
      let userMessage = "Failed to create conversation";

      if (error.name === "SequelizeValidationError") {
        userMessage = `Invalid data: ${
          error.errors?.map((e) => e.message).join(", ") || "Validation failed"
        }`;
      } else if (error.name === "SequelizeForeignKeyConstraintError") {
        userMessage = "One or more member IDs are invalid";
      } else if (error.name === "SequelizeUniqueConstraintError") {
        userMessage = "Conversation with these members already exists";
      } else if (error.name === "SequelizeDatabaseError") {
        userMessage = "Database operation failed. Please try again";
      } else if (error.message.includes("transaction")) {
        userMessage = "Database transaction failed. Please try again";
      } else if (error.message.includes("Invalid conversation type")) {
        userMessage = error.message;
      } else if (
        error.message.includes("Private conversations must have exactly")
      ) {
        userMessage = error.message;
      } else if (error.message.includes("Creator user not found")) {
        userMessage = error.message;
      } else if (error.message.includes("One or more member IDs are invalid")) {
        userMessage = error.message;
      } else {
        // Log the actual error for debugging but return a generic message
        logger.error("Unhandled error in createConversation:", error);
        userMessage = `Failed to create conversation: ${error.message}`;
      }

      return {
        success: false,
        error: userMessage,
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
      // First, find conversation IDs where both users are members
      const conversationIds = await db.ConversationMember.findAll({
        attributes: ["conversation_id"],
        where: {
          user_id: { [Op.in]: [userId1, userId2] },
        },
        group: ["conversation_id"],
        having: db.sequelize.literal("COUNT(DISTINCT user_id) = 2"),
      });

      if (conversationIds.length === 0) {
        return null;
      }

      const ids = conversationIds.map((item) => item.conversation_id);

      // Then find the private conversation from those IDs
      const conversation = await db.Conversation.findOne({
        where: {
          type: "private",
          id: { [Op.in]: ids },
        },
        include: [
          {
            model: db.ConversationMember,
            as: "members",
            include: [
              {
                model: db.User,
                as: "user",
                attributes: ["id", "name", "email", "is_online", "last_seen"],
                include: [
                  {
                    model: db.UserProfile,
                    as: "profile",
                    attributes: ["image_path"],
                  },
                ],
              },
            ],
          },
        ],
      });

      return conversation;
    } catch (error) {
      logger.error("Error finding private conversation:", error);
      return null;
    }
  }

  /**
   * Get conversation by ID with members
   * @param {number} conversationId - Conversation ID
   * @param {string} baseUrl - Base URL of the application (optional)
   * @returns {Object|null} Conversation with members
   */
  async getConversationById(conversationId, baseUrl = null) {
    try {
      const conversation = await db.Conversation.findByPk(conversationId, {
        include: [
          {
            model: db.ConversationMember,
            as: "members",
            include: [
              {
                model: db.User,
                as: "user",
                attributes: ["id", "name", "email", "is_online", "last_seen"],
                include: [
                  {
                    model: db.UserProfile,
                    as: "profile",
                    attributes: ["image_path"],
                  },
                ],
              },
            ],
          },
          {
            model: db.User,
            as: "creator",
            attributes: ["id", "name", "email"],
            include: [
              {
                model: db.UserProfile,
                as: "profile",
                attributes: ["image_path"],
              },
            ],
          },
        ],
      });

      if (conversation && baseUrl) {
        const conversationData = conversation.toJSON();
        
        // Add image URLs to all members
        if (conversationData.members) {
          conversationData.members = conversationData.members.map(member => {
            if (member.user) {
              this.addImageUrlToUser(member.user, baseUrl);
            }
            return member;
          });
        }

        // Add image URL to creator
        if (conversationData.creator) {
          this.addImageUrlToUser(conversationData.creator, baseUrl);
        }

        return conversationData;
      }

      return conversation;
    } catch (error) {
      logger.error("Error getting conversation:", error);
      return null;
    }
  }

  /**
   * Get user's conversations
   * @param {number} userId - User ID
   * @param {string} baseUrl - Base URL of the application
   * @returns {Array} User's conversations
   */
  async getUserConversations(userId, baseUrl) {
    try {
      // First, get conversation IDs where user is a member
      const userConversations = await db.ConversationMember.findAll({
        where: {
          user_id: userId,
          left_at: null, // Only active memberships
        },
        attributes: ["conversation_id"],
      });

      const conversationIds = userConversations.map((cm) => cm.conversation_id);

      if (conversationIds.length === 0) {
        return [];
      }

      // Then get full conversation details with ALL members
      const conversations = await db.Conversation.findAll({
        where: {
          id: { [Op.in]: conversationIds },
        },
        include: [
          {
            model: db.ConversationMember,
            as: "members",
            where: { left_at: null }, // Only active members
            include: [
              {
                model: db.User,
                as: "user",
                attributes: ["id", "name", "email", "is_online", "last_seen"],
                include: [
                  {
                    model: db.UserProfile,
                    as: "profile",
                    attributes: ["image_path"],
                  },
                ],
              },
            ],
          },
        ],
        order: [["last_message_at", "DESC"]],
      });

      // Get last message for each conversation
      const conversationsWithLastMessage = await Promise.all(
        conversations.map(async (conversation) => {
          const lastMessage = await db.Message.findOne({
            where: { conversation_id: conversation.id },
            include: [
              {
                model: db.User,
                as: "sender",
                attributes: ["id", "name"],
                include: [
                  {
                    model: db.UserProfile,
                    as: "profile",
                    attributes: ["image_path"],
                  },
                ],
              },
            ],
            order: [["created_at", "DESC"]],
          });

          const conversationData = conversation.toJSON();

          // Add image URLs to all members and mark current user
          if (conversationData.members && baseUrl) {
            conversationData.members = conversationData.members.map(member => {
              if (member.user) {
                this.addImageUrlToUser(member.user, baseUrl);
                // Mark if this member is the current user
                member.is_current_user = member.user_id === userId;
              }
              return member;
            });
          }

          // Add image URL to last message sender and identify if sender is current user
          let lastMessageData = null;
          if (lastMessage) {
            lastMessageData = {
              id: lastMessage.id,
              content: this.decryptMessage(lastMessage.content),
              message_type: lastMessage.message_type,
              created_at: lastMessage.created_at,
              sender: lastMessage.sender,
              is_sent_by_me: lastMessage.sender_id === userId,
            };
            
            if (lastMessageData.sender && baseUrl) {
              this.addImageUrlToUser(lastMessageData.sender, baseUrl);
            }
          }

          // Get unread message count for current user
          const unreadCount = await db.MessageStatus.count({
            where: {
              user_id: userId,
              status: { [Op.ne]: 'read' }
            },
            include: [{
              model: db.Message,
              as: 'message',
              where: {
                conversation_id: conversation.id,
                is_deleted: false
              }
            }]
          });

          return {
            ...conversationData,
            lastMessage: lastMessageData,
            unread_count: unreadCount,
          };
        })
      );

      // Filter out conversations that have no messages
      const conversationsWithMessages = conversationsWithLastMessage.filter(
        (conversation) => conversation.lastMessage !== null
      );

      return conversationsWithMessages;
    } catch (error) {
      logger.error("Error getting user conversations:", error);
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
          left_at: null,
        },
      });

      return !!member;
    } catch (error) {
      logger.error("Error checking conversation membership:", error);
      return false;
    }
  }

  /**
   * Send a message
   * @param {Object} data - Message data
   * @returns {Object} Result with success status and data
   */
  async sendMessage(data, baseUrl = null) {
    const transaction = await db.sequelize.transaction();

    try {
      const {
        senderId,
        conversationId,
        content,
        messageType = "text",
        replyToMessageId,
        forwardFromMessageId,
        attachmentUrl,
        attachmentName,
        attachmentSize,
        attachmentMimeType,
        metadata,
      } = data;

      // Verify user is member of conversation
      const isMember = await this.isConversationMember(
        conversationId,
        senderId
      );
      if (!isMember) {
        throw new Error("User is not a member of this conversation");
      }

      // Encrypt content
      const encryptedContent = content ? this.encryptMessage(content) : null;
      const contentPlain = content; // For search purposes

      // Create message
      const message = await db.Message.create(
        {
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
          is_deleted: false,
        },
        { transaction }
      );

      // Update conversation last message time
      await db.Conversation.update(
        { last_message_at: new Date() },
        { where: { id: conversationId }, transaction }
      );

      // Create message status for all conversation members
      const members = await db.ConversationMember.findAll({
        where: { conversation_id: conversationId, left_at: null },
        transaction,
      });

      const statusPromises = members.map((member) => {
        const status = member.user_id === senderId ? "read" : "sent";
        const readAt = member.user_id === senderId ? new Date() : null;

        return db.MessageStatus.create(
          {
            message_id: message.id,
            user_id: member.user_id,
            status,
            delivered_at: new Date(),
            read_at: readAt,
          },
          { transaction }
        );
      });

      await Promise.all(statusPromises);

      // Fetch complete message with sender info
      const completeMessage = await db.Message.findByPk(message.id, {
        include: [
          {
            model: db.User,
            as: "sender",
            attributes: ["id", "name", "email"],
            include: [
              {
                model: db.UserProfile,
                as: "profile",
                attributes: ["image_path"],
              },
            ],
          },
          {
            model: db.Message,
            as: "replyToMessage",
            include: [
              {
                model: db.User,
                as: "sender",
                attributes: ["id", "name"],
                include: [
                  {
                    model: db.UserProfile,
                    as: "profile",
                    attributes: ["image_path"],
                  },
                ],
              },
            ],
          },
        ],
        transaction,
      });

      // Decrypt content for response
      if (completeMessage.content) {
        completeMessage.dataValues.content = this.decryptMessage(
          completeMessage.content
        );
      }

      // Add image URLs to sender and reply sender if baseUrl provided
      if (baseUrl) {
        const messageData = completeMessage.toJSON();
        
        if (messageData.sender) {
          this.addImageUrlToUser(messageData.sender, baseUrl);
        }
        
        if (messageData.replyToMessage && messageData.replyToMessage.sender) {
          this.addImageUrlToUser(messageData.replyToMessage.sender, baseUrl);
        }
        
        // Update completeMessage with transformed data
        Object.assign(completeMessage.dataValues, messageData);
      }

      await transaction.commit();

      // Send notifications to other conversation members (fire and forget)
      // Don't wait for notifications to complete as they shouldn't block message sending
      setImmediate(async () => {
        try {
          const notificationResult = await sendMessageNotification(completeMessage, completeMessage.sender);
          logger.info('Message notification result', {
            messageId: completeMessage.id,
            result: notificationResult
          });
        } catch (error) {
          logger.error('Failed to send message notifications', {
            messageId: completeMessage.id,
            error: error.message
          });
        }
      });

      return {
        success: true,
        data: completeMessage,
      };
    } catch (error) {
      await transaction.rollback();
      logger.error("Error sending message:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get conversation messages with pagination
   * @param {number} conversationId - Conversation ID
   * @param {number} userId - User ID (for permission check)
   * @param {number} page - Page number
   * @param {number} limit - Messages per page
   * @param {string} baseUrl - Base URL of the application (optional)
   * @returns {Object} Messages with pagination info
   */
  async getConversationMessages(conversationId, userId, page = 1, limit = 50, baseUrl = null) {
    try {
      // Verify user is member of conversation
      const isMember = await this.isConversationMember(conversationId, userId);
      if (!isMember) {
        throw new Error("User is not a member of this conversation");
      }

      const offset = (page - 1) * limit;

      const { count, rows: messages } = await db.Message.findAndCountAll({
        where: {
          conversation_id: conversationId,
          is_deleted: false,
        },
        include: [
          {
            model: db.User,
            as: "sender",
            attributes: ["id", "name", "email"],
            include: [
              {
                model: db.UserProfile,
                as: "profile",
                attributes: ["image_path"],
              },
            ],
          },
          {
            model: db.Message,
            as: "replyToMessage",
            include: [
              {
                model: db.User,
                as: "sender",
                attributes: ["id", "name"],
                include: [
                  {
                    model: db.UserProfile,
                    as: "profile",
                    attributes: ["image_path"],
                  },
                ],
              },
            ],
          },
          {
            model: db.MessageStatus,
            as: "statuses",
            include: [
              {
                model: db.User,
                as: "user",
                attributes: ["id", "name"],
                include: [
                  {
                    model: db.UserProfile,
                    as: "profile",
                    attributes: ["image_path"],
                  },
                ],
              },
            ],
          },
        ],
        order: [["created_at", "DESC"]],
        limit,
        offset,
      });

      // Decrypt message contents and add image URLs
      const decryptedMessages = messages.map((message) => {
        const messageData = message.toJSON();
        if (messageData.content) {
          messageData.content = this.decryptMessage(messageData.content);
        }
        
        // Add image URLs if baseUrl provided
        if (baseUrl) {
          if (messageData.sender) {
            this.addImageUrlToUser(messageData.sender, baseUrl);
          }
          
          if (messageData.replyToMessage && messageData.replyToMessage.sender) {
            this.addImageUrlToUser(messageData.replyToMessage.sender, baseUrl);
          }
          
          if (messageData.statuses) {
            messageData.statuses = messageData.statuses.map(status => {
              if (status.user) {
                this.addImageUrlToUser(status.user, baseUrl);
              }
              return status;
            });
          }
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
            hasPreviousPage: page > 1,
          },
        },
      };
    } catch (error) {
      logger.error("Error getting conversation messages:", error);
      return {
        success: false,
        error: error.message,
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
          status: "read",
          read_at: new Date(),
        },
        {
          where: {
            message_id: messageId,
            user_id: userId,
          },
        }
      );

      return true;
    } catch (error) {
      logger.error("Error marking message as read:", error);
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
        last_typing_at: now,
      });

      return true;
    } catch (error) {
      logger.error("Error updating typing status:", error);
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
      logger.error("Error clearing typing statuses:", error);
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
          left_at: null,
        },
        include: [
          {
            model: db.User,
            as: "user",
            where: { is_online: false },
          },
        ],
      });

      // Create notifications for offline users
      const notificationPromises = members.map((member) =>
        db.Notification.create({
          user_id: member.user_id,
          message_id: message.id,
          conversation_id: message.conversation_id,
          type: "message",
          title: `New message from ${message.sender.name}`,
          body: message.content_plain || "Sent an attachment",
          data: JSON.stringify({
            conversationId: message.conversation_id,
            messageId: message.id,
          }),
          is_seen: false,
          is_read: false,
          push_sent: false,
        })
      );

      await Promise.all(notificationPromises);

      return true;
    } catch (error) {
      logger.error("Error sending notifications:", error);
      return false;
    }
  }

  /**
   * Search messages in conversations
   * @param {number} userId - User ID
   * @param {string} query - Search query
   * @param {number} conversationId - Optional conversation ID to limit search
   * @param {string} baseUrl - Base URL of the application (optional)
   * @returns {Object} Search results
   */
  async searchMessages(userId, query, conversationId = null, baseUrl = null) {
    try {
      // Get user's conversation IDs
      const userConversations = await db.ConversationMember.findAll({
        where: { user_id: userId, left_at: null },
        attributes: ["conversation_id"],
      });

      const conversationIds = userConversations.map((cm) => cm.conversation_id);

      if (conversationIds.length === 0) {
        return { success: true, data: [] };
      }

      const whereClause = {
        conversation_id: conversationId
          ? conversationId
          : { [Op.in]: conversationIds },
        content_plain: { [Op.iLike]: `%${query}%` },
        is_deleted: false,
      };

      const messages = await db.Message.findAll({
        where: whereClause,
        include: [
          {
            model: db.User,
            as: "sender",
            attributes: ["id", "name", "email"],
            include: [
              {
                model: db.UserProfile,
                as: "profile",
                attributes: ["image_path"],
              },
            ],
          },
          {
            model: db.Conversation,
            as: "conversation",
            attributes: ["id", "name", "type"],
          },
        ],
        order: [["created_at", "DESC"]],
        limit: 50,
      });

      // Decrypt message contents and add image URLs
      const decryptedMessages = messages.map((message) => {
        const messageData = message.toJSON();
        if (messageData.content) {
          messageData.content = this.decryptMessage(messageData.content);
        }
        
        // Add image URL to sender if baseUrl provided
        if (baseUrl && messageData.sender) {
          this.addImageUrlToUser(messageData.sender, baseUrl);
        }
        
        return messageData;
      });

      return {
        success: true,
        data: decryptedMessages,
      };
    } catch (error) {
      logger.error("Error searching messages:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

module.exports = new ChatService();
