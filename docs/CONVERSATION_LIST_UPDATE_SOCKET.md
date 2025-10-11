# Conversation List Update via Socket.IO

## Overview

This document explains how to update the conversation list when a user receives a new message in any conversation using Socket.IO events.

## Current Implementation

Currently, when a message is sent:
1. The message is broadcasted to all members via the `new_message` event
2. The conversation's `last_message_at` timestamp is updated in the database
3. Users in the active chat screen receive the message

**Problem:** Users viewing the conversation list don't get notified to refresh their list.

## Solution: Emit `conversation_updated` Event

### Backend Implementation

#### Step 1: Modify Socket Event Handler

In `config/socket.config.js`, update the `send_message` handler to emit an additional event:

```javascript
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
      // 1. Emit message to all conversation members (existing)
      io.to(`conversation_${data.conversationId}`).emit('new_message', result.data);

      // 2. NEW: Emit conversation update to refresh conversation list
      const conversationMembers = await chatService.getConversationMembers(data.conversationId);
      
      // Send personalized conversation update to each member
      for (const member of conversationMembers) {
        const conversationUpdate = {
          conversationId: data.conversationId,
          lastMessage: {
            id: result.data.id,
            content: result.data.content,
            message_type: result.data.message_type,
            created_at: result.data.created_at,
            sender: {
              id: result.data.sender.id,
              name: result.data.sender.name
            },
            is_sent_by_me: member.user_id === socket.userId
          },
          last_message_at: new Date(),
          unread_count: member.user_id === socket.userId ? 0 : await chatService.getUnreadCount(data.conversationId, member.user_id)
        };

        // Emit to specific user's socket
        const memberUser = await db.User.findByPk(member.user_id);
        if (memberUser && memberUser.socket_id) {
          io.to(memberUser.socket_id).emit('conversation_updated', conversationUpdate);
        }
      }

      // 3. Send push notifications to offline users (existing)
      await chatService.sendNotificationsForMessage(result.data);
    } else {
      socket.emit('error', { message: result.error });
    }
  } catch (error) {
    logger.error('Error sending message:', error);
    socket.emit('error', { message: 'Failed to send message' });
  }
});
```

#### Step 2: Add Helper Methods to ChatService

Add these methods to `services/chatService.js`:

```javascript
/**
 * Get conversation members
 * @param {number} conversationId - Conversation ID
 * @returns {Array} Array of conversation members
 */
async getConversationMembers(conversationId) {
  try {
    const members = await db.ConversationMember.findAll({
      where: {
        conversation_id: conversationId,
        left_at: null
      },
      attributes: ['user_id', 'role']
    });

    return members;
  } catch (error) {
    logger.error('Error getting conversation members:', error);
    return [];
  }
}

/**
 * Get unread message count for a specific user in a conversation
 * @param {number} conversationId - Conversation ID
 * @param {number} userId - User ID
 * @returns {number} Unread message count
 */
async getUnreadCount(conversationId, userId) {
  try {
    const count = await db.MessageStatus.count({
      where: {
        user_id: userId,
        status: { [Op.ne]: 'read' }
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

    return count;
  } catch (error) {
    logger.error('Error getting unread count:', error);
    return 0;
  }
}
```

## Alternative Solution: Simpler Approach

If you want a simpler implementation that doesn't require individual socket targeting:

#### Simplified Socket Event

```javascript
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
      // Emit message to conversation room
      io.to(`conversation_${data.conversationId}`).emit('new_message', result.data);

      // Emit simplified conversation update
      io.to(`conversation_${data.conversationId}`).emit('conversation_updated', {
        conversationId: data.conversationId,
        lastMessage: {
          id: result.data.id,
          content: result.data.content,
          message_type: result.data.message_type,
          created_at: result.data.created_at,
          sender_id: socket.userId,
          sender: {
            id: result.data.sender.id,
            name: result.data.sender.name
          }
        },
        last_message_at: new Date()
      });

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
```

### Frontend Implementation

#### React/React Native Example

```javascript
// Socket connection setup
import io from 'socket.io-client';

const socket = io('YOUR_SERVER_URL', {
  auth: {
    token: userToken
  }
});

// In your ConversationList component
useEffect(() => {
  // Listen for conversation updates
  socket.on('conversation_updated', (data) => {
    console.log('Conversation updated:', data);
    
    // Update the conversation in your local state
    setConversations(prevConversations => {
      // Find and update the conversation
      const updatedConversations = prevConversations.map(conv => {
        if (conv.id === data.conversationId) {
          return {
            ...conv,
            lastMessage: data.lastMessage,
            last_message_at: data.last_message_at,
            unread_count: data.unread_count || conv.unread_count
          };
        }
        return conv;
      });

      // Re-sort by last_message_at
      return updatedConversations.sort((a, b) => 
        new Date(b.last_message_at) - new Date(a.last_message_at)
      );
    });

    // Optional: Play notification sound or show badge
    if (data.lastMessage.sender_id !== currentUserId) {
      playNotificationSound();
      updateUnreadBadge();
    }
  });

  // Listen for new messages (for active chat screen)
  socket.on('new_message', (message) => {
    console.log('New message received:', message);
    
    // Update active chat screen if in the same conversation
    if (activeConversationId === message.conversation_id) {
      addMessageToChat(message);
      
      // Mark as read if user is viewing the conversation
      socket.emit('mark_message_read', {
        messageId: message.id,
        conversationId: message.conversation_id
      });
    }
  });

  return () => {
    socket.off('conversation_updated');
    socket.off('new_message');
  };
}, []);
```

#### Vue.js Example

```javascript
import io from 'socket.io-client';

export default {
  data() {
    return {
      socket: null,
      conversations: []
    };
  },
  
  mounted() {
    this.socket = io('YOUR_SERVER_URL', {
      auth: {
        token: this.userToken
      }
    });

    // Listen for conversation updates
    this.socket.on('conversation_updated', (data) => {
      const index = this.conversations.findIndex(
        conv => conv.id === data.conversationId
      );

      if (index !== -1) {
        // Update existing conversation
        this.conversations[index] = {
          ...this.conversations[index],
          lastMessage: data.lastMessage,
          last_message_at: data.last_message_at,
          unread_count: data.unread_count || this.conversations[index].unread_count
        };

        // Re-sort conversations
        this.conversations.sort((a, b) => 
          new Date(b.last_message_at) - new Date(a.last_message_at)
        );
      }
    });
  },

  beforeDestroy() {
    if (this.socket) {
      this.socket.off('conversation_updated');
      this.socket.disconnect();
    }
  }
};
```

## Event Flow Diagram

```
User A sends message
       ↓
Backend receives 'send_message' event
       ↓
chatService.sendMessage() creates message & updates conversation
       ↓
Backend emits TWO events:
       ├─→ 'new_message' → All members in conversation room
       │   (Updates active chat screen)
       │
       └─→ 'conversation_updated' → All members in conversation room
           (Updates conversation list)
       ↓
User B receives both events:
       ├─→ If viewing conversation list → Update that conversation
       └─→ If in active chat → Display message + update list
```

## Benefits of This Approach

1. **Real-time Updates**: Conversation list updates instantly without polling
2. **Efficient**: Only sends updates when messages are actually sent
3. **Personalized**: Each user gets their own unread count
4. **Scalable**: Works with any number of conversations and users
5. **Battery Efficient**: No need for periodic API calls to refresh the list

## Additional Enhancements

### 1. Handle Read Receipts

When a user marks messages as read, update the conversation list:

```javascript
socket.on('mark_message_read', async (data) => {
  const { messageId, conversationId } = data;
  
  await chatService.markMessageAsRead(messageId, socket.userId);
  
  // Emit read receipt
  socket.to(`conversation_${conversationId}`).emit('message_read', {
    messageId,
    userId: socket.userId,
    readAt: new Date()
  });
  
  // Update unread count for this user
  const unreadCount = await chatService.getUnreadCount(conversationId, socket.userId);
  socket.emit('unread_count_updated', {
    conversationId,
    unreadCount
  });
});
```

### 2. Handle Message Deletion

```javascript
socket.on('delete_message', async (data) => {
  const { messageId, conversationId } = data;
  
  // Delete message logic...
  
  // If it was the last message, get new last message and update
  const conversation = await chatService.getConversationById(conversationId);
  
  io.to(`conversation_${conversationId}`).emit('conversation_updated', {
    conversationId,
    lastMessage: conversation.lastMessage,
    last_message_at: conversation.last_message_at
  });
});
```

## Testing

### Test Scenarios

1. **User A sends message to User B**
   - User B should see the conversation move to top of list
   - User B should see the new last message preview
   - User B should see unread count increment

2. **User in active chat**
   - Should see both message appear in chat AND conversation list update
   - Unread count should remain 0 if they're viewing the chat

3. **Group conversations**
   - All members should receive the update
   - Each user's unread count should be calculated independently

4. **Offline users**
   - When they come back online, should see updated conversation list
   - Push notifications should have been sent

## Implementation Checklist

- [ ] Add `conversation_updated` event emission in `socket.config.js`
- [ ] Add helper methods to `chatService.js`
- [ ] Frontend: Listen to `conversation_updated` event
- [ ] Frontend: Update conversation list state
- [ ] Frontend: Re-sort conversations by timestamp
- [ ] Frontend: Update unread badges
- [ ] Test with multiple users
- [ ] Test in group conversations
- [ ] Test when user is offline/online
- [ ] Test read receipts update the list

## Performance Considerations

1. **Optimize Database Queries**: The unread count query runs for each member on every message. Consider caching or using Redis.

2. **Batch Updates**: For very active conversations, consider debouncing the `conversation_updated` events (e.g., max once per second).

3. **Selective Updates**: Only emit updates to users who aren't currently viewing the active chat (they already have the message).

## Conclusion

The recommended approach is to use the **Simplified Solution** which emits a `conversation_updated` event to all members of the conversation room. The frontend then handles updating the conversation list state and re-sorting as needed. This provides real-time updates without polling and works seamlessly with your existing Socket.IO infrastructure.

