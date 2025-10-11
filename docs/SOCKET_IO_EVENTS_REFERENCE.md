# Socket.IO Events Reference

## Overview

This document provides a complete reference for all Socket.IO events available in the BuddyDesk chat system.

## Connection

### Authentication

All Socket.IO connections require JWT authentication:

```javascript
const socket = io('YOUR_SERVER_URL', {
  auth: {
    token: 'YOUR_JWT_TOKEN'
  }
});
```

### Connection Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `connect` | Server → Client | Emitted when successfully connected |
| `connect_error` | Server → Client | Emitted when connection fails |
| `disconnect` | Server → Client | Emitted when disconnected |

**Example:**
```javascript
socket.on('connect', () => {
  console.log('Connected:', socket.id);
});

socket.on('connect_error', (error) => {
  console.error('Connection error:', error);
});
```

## Client → Server Events (Emit)

### 1. join_conversation

Join a specific conversation room to receive updates.

**Emit:**
```javascript
socket.emit('join_conversation', {
  conversationId: 123
});
```

**Response:** None (automatic room join)

---

### 2. leave_conversation

Leave a conversation room.

**Emit:**
```javascript
socket.emit('leave_conversation', {
  conversationId: 123
});
```

**Response:** None

---

### 3. send_message

Send a new message to a conversation.

**Emit:**
```javascript
socket.emit('send_message', {
  conversationId: 123,
  content: "Hello!",
  messageType: "text", // text, image, video, audio, file
  replyToMessageId: 456, // Optional
  attachmentUrl: "https://...", // Optional
  attachmentName: "file.pdf", // Optional
  attachmentSize: 1024, // Optional (bytes)
  attachmentMimeType: "application/pdf" // Optional
});
```

**Success Response:** `new_message` + `conversation_updated` events  
**Error Response:** `error` event

---

### 4. mark_message_read

Mark a single message as read.

**Emit:**
```javascript
socket.emit('mark_message_read', {
  messageId: 456,
  conversationId: 123
});
```

**Success Response:** `message_read` event to other users  
**Error Response:** None (silent fail)

---

### 5. mark_conversation_read ⭐ NEW

Mark all unread messages in a conversation as read (bulk operation).

**Emit:**
```javascript
socket.emit('mark_conversation_read', {
  conversationId: 123
});
```

**Success Response:**
- `conversation_marked_read` (to sender)
- `conversation_read` (to other members)

**Error Response:** `error` event

**Example:**
```javascript
socket.emit('mark_conversation_read', { conversationId: 123 });

socket.on('conversation_marked_read', (data) => {
  console.log(`Marked ${data.messageCount} messages as read`);
  // data: { conversationId: 123, messageCount: 5 }
});
```

---

### 6. typing_start

Indicate that user started typing.

**Emit:**
```javascript
socket.emit('typing_start', {
  conversationId: 123
});
```

**Success Response:** `user_typing` event to other users  
**Error Response:** None

---

### 7. typing_stop

Indicate that user stopped typing.

**Emit:**
```javascript
socket.emit('typing_stop', {
  conversationId: 123
});
```

**Success Response:** `user_typing` event to other users  
**Error Response:** None

---

### 8. create_conversation

Create a new conversation.

**Emit:**
```javascript
socket.emit('create_conversation', {
  type: "private", // or "group"
  name: "Group Name", // Required for groups, null for private
  description: "Group description", // Optional
  memberIds: [2, 3, 4] // Array of user IDs (1 user for private, multiple for group)
});
```

**Success Response:** `conversation_created` event  
**Error Response:** `error` event

---

### 9. refresh_conversation_list ⭐ NEW

Manually refresh the entire conversation list.

**Emit:**
```javascript
socket.emit('refresh_conversation_list');
```

**Success Response:** `conversation_list_refreshed` event  
**Error Response:** `error` event

**Example:**
```javascript
socket.emit('refresh_conversation_list');

socket.on('conversation_list_refreshed', (data) => {
  console.log('Conversations:', data.conversations);
  console.log('Synced at:', data.timestamp);
  // Update your conversation list state
  setConversations(data.conversations);
});
```

---

## Server → Client Events (Listen)

### 1. new_message

Emitted when a new message is sent in a conversation you're a member of.

**Listen:**
```javascript
socket.on('new_message', (data) => {
  console.log('New message:', data);
  // Add message to chat
  setMessages(prev => [...prev, data]);
});
```

**Payload:**
```javascript
{
  id: 456,
  conversation_id: 123,
  sender_id: 2,
  sender: {
    id: 2,
    name: "John Doe",
    profile: {
      image_path: "uploads/images/...",
      image_url: "https://..."
    }
  },
  content: "Hello!",
  message_type: "text",
  created_at: "2025-10-11T10:30:00Z",
  attachment_url: null,
  replyToMessage: null, // If replying to another message
  // ... other fields
}
```

---

### 2. conversation_updated ⭐ NEW

Emitted when a conversation's last message is updated (for conversation list updates).

**Listen:**
```javascript
socket.on('conversation_updated', (data) => {
  console.log('Conversation updated:', data);
  // Update conversation in list
  updateConversation(data);
});
```

**Payload:**
```javascript
{
  conversationId: 123,
  lastMessage: {
    id: 456,
    content: "Hello!",
    message_type: "text",
    created_at: "2025-10-11T10:30:00Z",
    sender_id: 2,
    sender: {
      id: 2,
      name: "John Doe",
      profile: { ... }
    }
  },
  last_message_at: "2025-10-11T10:30:00Z"
}
```

**Use Case:** Update conversation list when new message arrives

---

### 3. message_read

Emitted when someone marks a message as read (read receipt).

**Listen:**
```javascript
socket.on('message_read', (data) => {
  console.log('Message read:', data);
  // Update message read status
  updateMessageReadStatus(data.messageId, data.userId);
});
```

**Payload:**
```javascript
{
  messageId: 456,
  userId: 2,
  readAt: "2025-10-11T10:35:00Z"
}
```

---

### 4. conversation_read ⭐ NEW

Emitted when someone marks all messages in a conversation as read (bulk read receipt).

**Listen:**
```javascript
socket.on('conversation_read', (data) => {
  console.log(`User ${data.userId} read ${data.messageCount} messages`);
  // Update read receipts for all messages from this user
  updateConversationReadStatus(data);
});
```

**Payload:**
```javascript
{
  conversationId: 123,
  userId: 2,
  readAt: "2025-10-11T10:35:00Z",
  messageCount: 5
}
```

**Use Case:** Show read receipts (double checkmarks) when user reads your messages

---

### 5. conversation_marked_read ⭐ NEW

Confirmation that your request to mark conversation as read was successful.

**Listen:**
```javascript
socket.on('conversation_marked_read', (data) => {
  console.log(`Successfully marked ${data.messageCount} messages as read`);
  // Update local unread count
  setUnreadCount(0);
});
```

**Payload:**
```javascript
{
  conversationId: 123,
  messageCount: 5
}
```

---

### 6. user_typing

Emitted when a user starts or stops typing.

**Listen:**
```javascript
socket.on('user_typing', (data) => {
  if (data.isTyping) {
    showTypingIndicator(data.userName);
  } else {
    hideTypingIndicator(data.userName);
  }
});
```

**Payload:**
```javascript
{
  userId: 2,
  userName: "John Doe",
  conversationId: 123,
  isTyping: true // or false
}
```

---

### 7. conversation_created

Emitted when a new conversation is created.

**Listen:**
```javascript
socket.on('conversation_created', (data) => {
  console.log('New conversation:', data);
  // Add to conversation list
  addConversation(data);
});
```

**Payload:**
```javascript
{
  id: 123,
  type: "private",
  name: null,
  created_by: 1,
  members: [
    { user_id: 1, role: "admin", user: { ... } },
    { user_id: 2, role: "member", user: { ... } }
  ],
  created_at: "2025-10-11T10:00:00Z"
}
```

---

### 8. conversation_list_refreshed ⭐ NEW

Response to `refresh_conversation_list` request.

**Listen:**
```javascript
socket.on('conversation_list_refreshed', (data) => {
  console.log('Full list synced:', data.conversations);
  setConversations(data.conversations);
  setLastSync(data.timestamp);
});
```

**Payload:**
```javascript
{
  conversations: [
    {
      id: 123,
      type: "private",
      lastMessage: { ... },
      unread_count: 5,
      members: [ ... ],
      // ... full conversation data
    },
    // ... more conversations
  ],
  timestamp: "2025-10-11T10:40:00Z"
}
```

---

### 9. user_online

Emitted when a user comes online.

**Listen:**
```javascript
socket.on('user_online', (data) => {
  console.log(`${data.name} is online`);
  updateUserStatus(data.userId, true);
});
```

**Payload:**
```javascript
{
  userId: 2,
  name: "John Doe",
  timestamp: "2025-10-11T10:00:00Z"
}
```

---

### 10. user_offline

Emitted when a user goes offline.

**Listen:**
```javascript
socket.on('user_offline', (data) => {
  console.log(`${data.name} went offline`);
  updateUserStatus(data.userId, false, data.lastSeen);
});
```

**Payload:**
```javascript
{
  userId: 2,
  name: "John Doe",
  lastSeen: "2025-10-11T10:30:00Z"
}
```

---

### 11. error

Emitted when an operation fails.

**Listen:**
```javascript
socket.on('error', (data) => {
  console.error('Socket error:', data.message);
  showErrorToast(data.message);
});
```

**Payload:**
```javascript
{
  message: "Failed to send message"
}
```

---

## Complete Example

```javascript
import io from 'socket.io-client';

// Initialize
const socket = io('https://api.buddydesk.in', {
  auth: {
    token: getAuthToken()
  }
});

// Connection events
socket.on('connect', () => {
  console.log('Connected');
});

socket.on('connect_error', (error) => {
  console.error('Connection failed:', error);
});

// Chat events
socket.on('new_message', (data) => {
  addMessageToChat(data);
  
  // Mark as read if user is viewing
  if (isConversationActive(data.conversation_id)) {
    socket.emit('mark_message_read', {
      messageId: data.id,
      conversationId: data.conversation_id
    });
  }
});

socket.on('conversation_updated', (data) => {
  updateConversationInList(data);
});

socket.on('user_typing', (data) => {
  if (data.isTyping) {
    showTypingIndicator(data.userId, data.userName);
  } else {
    hideTypingIndicator(data.userId);
  }
});

socket.on('conversation_read', (data) => {
  markMessagesAsReadBy(data.conversationId, data.userId);
});

socket.on('user_online', (data) => {
  updateUserOnlineStatus(data.userId, true);
});

socket.on('user_offline', (data) => {
  updateUserOnlineStatus(data.userId, false);
});

// Send message
const sendMessage = (conversationId, content) => {
  socket.emit('send_message', {
    conversationId,
    content,
    messageType: 'text'
  });
};

// Mark conversation as read
const markConversationAsRead = (conversationId) => {
  socket.emit('mark_conversation_read', { conversationId });
};

// Typing indicators
let typingTimeout;
const handleTyping = (conversationId) => {
  socket.emit('typing_start', { conversationId });
  
  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    socket.emit('typing_stop', { conversationId });
  }, 3000);
};

// Cleanup
const cleanup = () => {
  socket.disconnect();
};
```

## Event Flow Diagrams

### Sending a Message

```
User types message
       ↓
socket.emit('send_message', { ... })
       ↓
Backend receives & processes
       ↓
Backend emits:
  ├─→ new_message (to all members)
  └─→ conversation_updated (to all members)
       ↓
All clients receive and update UI
```

### Marking Messages as Read

```
User opens conversation
       ↓
socket.emit('mark_conversation_read', { conversationId })
       ↓
Backend marks all unread as read
       ↓
Backend emits:
  ├─→ conversation_marked_read (to sender)
  └─→ conversation_read (to other members)
       ↓
Sender: Updates local unread count
Other members: Show read receipts
```

## Best Practices

1. **Always clean up listeners:**
```javascript
useEffect(() => {
  socket.on('new_message', handleNewMessage);
  
  return () => {
    socket.off('new_message', handleNewMessage);
  };
}, []);
```

2. **Handle reconnection:**
```javascript
socket.on('connect', () => {
  // Rejoin conversation rooms
  currentConversations.forEach(conv => {
    socket.emit('join_conversation', { conversationId: conv.id });
  });
});
```

3. **Optimistic updates:**
```javascript
// Update UI immediately
addMessageToUI(message);

// Then send to server
socket.emit('send_message', message);
```

4. **Error handling:**
```javascript
socket.on('error', (error) => {
  // Revert optimistic update
  removeMessageFromUI(message.tempId);
  showError(error.message);
});
```

## Rate Limits

- Messages: 60 per minute per user
- Typing indicators: 30 per minute per user
- General chat operations: 100 per minute per user

## Support

For questions or issues:
- Email: support@buddydesk.com
- Documentation: See `/docs` folder

## Related Documentation

- **Conversation List Updates**: `docs/CONVERSATION_LIST_UPDATE_QUICK_START.md`
- **Mark Messages Read**: `docs/MARK_MESSAGES_READ_QUICK_START.md`
- **Frontend Examples**: `docs/FRONTEND_CONVERSATION_LIST_EXAMPLE.md`

