const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
const db = require('../models');
const chatService = require('../services/chatService');

/**
 * Initialize Socket.io with authentication and event handlers
 * @param {Object} server - HTTP server instance
 * @returns {Object} Socket.io instance
 */
function initializeSocket(server) {
  const io = socketIo(server, {
    cors: {
      origin: process.env.NODE_ENV === 'production' 
        ? process.env.CORS_ORIGIN_PRODUCTION?.split(',') || []
        : process.env.CORS_ORIGIN_DEVELOPMENT?.split(',') || ['http://localhost:3000', 'http://localhost:3001'],
      methods: ['GET', 'POST'],
      credentials: true
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000
  });

  // Authentication middleware for Socket.io
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await db.User.findByPk(decoded.userId);
      
      if (!user) {
        return next(new Error('User not found'));
      }

      socket.userId = user.id;
      socket.user = user;
      next();
    } catch (error) {
      logger.error('Socket authentication failed:', error);
      next(new Error('Authentication failed'));
    }
  });

  // Connection event handler
  io.on('connection', async (socket) => {
    try {
      logger.info(`User connected: ${socket.user.name} (ID: ${socket.userId})`);
      
      // Update user online status
      await db.User.update(
        { 
          is_online: true, 
          last_seen: new Date(),
          socket_id: socket.id 
        },
        { where: { id: socket.userId } }
      );

      // Join user to their conversation rooms
      const userConversations = await chatService.getUserConversations(socket.userId);
      userConversations.forEach(conversation => {
        socket.join(`conversation_${conversation.id}`);
      });

      // Emit user online status to contacts
      socket.broadcast.emit('user_online', {
        userId: socket.userId,
        name: socket.user.name,
        timestamp: new Date()
      });

      // Handle joining a conversation
      socket.on('join_conversation', async (data) => {
        try {
          const { conversationId } = data;
          
          // Verify user is member of conversation
          const isMember = await chatService.isConversationMember(conversationId, socket.userId);
          if (!isMember) {
            socket.emit('error', { message: 'Not authorized to join this conversation' });
            return;
          }

          socket.join(`conversation_${conversationId}`);
          logger.info(`User ${socket.userId} joined conversation ${conversationId}`);
        } catch (error) {
          logger.error('Error joining conversation:', error);
          socket.emit('error', { message: 'Failed to join conversation' });
        }
      });

      // Handle leaving a conversation
      socket.on('leave_conversation', (data) => {
        const { conversationId } = data;
        socket.leave(`conversation_${conversationId}`);
        logger.info(`User ${socket.userId} left conversation ${conversationId}`);
      });

      // Handle sending messages
      socket.on('send_message', async (data) => {
        try {
          const result = await chatService.sendMessage({
            senderId: socket.userId,
            conversationId: data.conversationId,
            content: data.content,
            messageType: data.messageType || 'text',
            replyToMessageId: data.replyToMessageId,
            attachmentUrl: data.attachmentUrl,
            attachmentName: data.attachmentName,
            attachmentSize: data.attachmentSize,
            attachmentMimeType: data.attachmentMimeType
          });

          if (result.success) {
            // Emit message to all conversation members
            io.to(`conversation_${data.conversationId}`).emit('new_message', result.data);
            
            // Send push notifications to offline users
            await chatService.sendNotificationsForMessage(result.data);
          } else {
            socket.emit('error', { message: result.error });
          }
        } catch (error) {
          logger.error('Error sending message:', error);
          socket.emit('error', { message: 'Failed to send message' });
        }
      });

      // Handle typing indicators
      socket.on('typing_start', async (data) => {
        try {
          const { conversationId } = data;
          
          await chatService.updateTypingStatus(conversationId, socket.userId, true);
          
          socket.to(`conversation_${conversationId}`).emit('user_typing', {
            userId: socket.userId,
            userName: socket.user.name,
            conversationId,
            isTyping: true
          });
        } catch (error) {
          logger.error('Error updating typing status:', error);
        }
      });

      socket.on('typing_stop', async (data) => {
        try {
          const { conversationId } = data;
          
          await chatService.updateTypingStatus(conversationId, socket.userId, false);
          
          socket.to(`conversation_${conversationId}`).emit('user_typing', {
            userId: socket.userId,
            userName: socket.user.name,
            conversationId,
            isTyping: false
          });
        } catch (error) {
          logger.error('Error updating typing status:', error);
        }
      });

      // Handle message status updates (read receipts)
      socket.on('mark_message_read', async (data) => {
        try {
          const { messageId, conversationId } = data;
          
          await chatService.markMessageAsRead(messageId, socket.userId);
          
          socket.to(`conversation_${conversationId}`).emit('message_read', {
            messageId,
            userId: socket.userId,
            readAt: new Date()
          });
        } catch (error) {
          logger.error('Error marking message as read:', error);
        }
      });

      // Handle conversation creation
      socket.on('create_conversation', async (data) => {
        try {
          const result = await chatService.createConversation({
            createdBy: socket.userId,
            type: data.type,
            name: data.name,
            description: data.description,
            memberIds: data.memberIds
          });

          if (result.success) {
            // Join creator to the new conversation
            socket.join(`conversation_${result.data.id}`);
            
            // Notify other members
            result.data.members.forEach(member => {
              if (member.user_id !== socket.userId) {
                io.to(`user_${member.user_id}`).emit('conversation_created', result.data);
              }
            });
            
            socket.emit('conversation_created', result.data);
          } else {
            socket.emit('error', { message: result.error });
          }
        } catch (error) {
          logger.error('Error creating conversation:', error);
          socket.emit('error', { message: 'Failed to create conversation' });
        }
      });

      // Handle disconnection
      socket.on('disconnect', async () => {
        try {
          logger.info(`User disconnected: ${socket.user.name} (ID: ${socket.userId})`);
          
          // Update user offline status
          await db.User.update(
            { 
              is_online: false, 
              last_seen: new Date(),
              socket_id: null 
            },
            { where: { id: socket.userId } }
          );

          // Clear typing statuses
          await chatService.clearUserTypingStatuses(socket.userId);

          // Emit user offline status
          socket.broadcast.emit('user_offline', {
            userId: socket.userId,
            name: socket.user.name,
            lastSeen: new Date()
          });
        } catch (error) {
          logger.error('Error handling disconnect:', error);
        }
      });

    } catch (error) {
      logger.error('Error in socket connection handler:', error);
      socket.disconnect();
    }
  });

  return io;
}

module.exports = { initializeSocket };