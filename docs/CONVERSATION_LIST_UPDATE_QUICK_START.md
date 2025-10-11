# Conversation List Update - Quick Start Guide

## Overview

When any user receives a new message in any conversation, the conversation list automatically updates via Socket.IO events.

## What Was Implemented

### Backend Changes (Already Done ✅)

1. **Socket.IO Event** - `config/socket.config.js`
   - Added `conversation_updated` event emission when messages are sent
   - Broadcasts to all conversation members

2. **REST API Event** - `controllers/chatController.js`
   - Added same event for HTTP-based message sending (file uploads)
   
3. **Helper Methods** - `services/chatService.js`
   - `getConversationMembers()` - Get all members of a conversation
   - `getUnreadCount()` - Get unread count for a specific user

## How It Works

```
User A sends message
       ↓
Backend creates message & updates conversation.last_message_at
       ↓
Backend emits TWO Socket.IO events:
       ├─→ 'new_message' (for active chat screen)
       └─→ 'conversation_updated' (for conversation list)
       ↓
User B receives 'conversation_updated' event
       ↓
Frontend updates conversation list:
       ├─→ Updates last message preview
       ├─→ Updates timestamp
       ├─→ Increments unread count
       ├─→ Re-sorts conversation to top
       └─→ Plays notification sound
```

## Socket.IO Event Structure

### `conversation_updated` Event

**Emitted To:** All members of the conversation room

**Payload:**
```javascript
{
  conversationId: 123,
  lastMessage: {
    id: 456,
    content: "Hello!",
    message_type: "text",
    created_at: "2025-10-11T10:30:00Z",
    sender_id: 789,
    sender: {
      id: 789,
      name: "John Doe",
      profile: {
        image_path: "uploads/images/...",
        image_url: "https://api.example.com/api/files/..."
      }
    }
  },
  last_message_at: "2025-10-11T10:30:00Z"
}
```

## Frontend Implementation (Required)

### Step 1: Listen to Socket Event

```javascript
socket.on('conversation_updated', (data) => {
  // Update conversation in your state
  updateConversationInList(data);
});
```

### Step 2: Update Conversation State

```javascript
const updateConversationInList = (data) => {
  setConversations(prevConversations => {
    // Find and update the conversation
    const updated = prevConversations.map(conv => {
      if (conv.id === data.conversationId) {
        return {
          ...conv,
          lastMessage: data.lastMessage,
          last_message_at: data.last_message_at,
          // Increment unread if message is from someone else
          unread_count: data.lastMessage.sender_id === currentUserId
            ? conv.unread_count
            : (conv.unread_count || 0) + 1
        };
      }
      return conv;
    });

    // Re-sort by timestamp (most recent first)
    return updated.sort((a, b) => 
      new Date(b.last_message_at) - new Date(a.last_message_at)
    );
  });

  // Play notification sound if from someone else
  if (data.lastMessage.sender_id !== currentUserId) {
    playNotificationSound();
  }
};
```

### Step 3: Handle User Interaction

```javascript
const handleConversationClick = (conversation) => {
  // Navigate to chat
  navigateToChat(conversation.id);
  
  // Reset unread count locally
  setConversations(prev => 
    prev.map(conv => 
      conv.id === conversation.id 
        ? { ...conv, unread_count: 0 }
        : conv
    )
  );
};
```

## Complete Code Examples

See detailed implementations in:
- **React/React Native**: `docs/FRONTEND_CONVERSATION_LIST_EXAMPLE.md`
- **Full Documentation**: `docs/CONVERSATION_LIST_UPDATE_SOCKET.md`

## Testing Checklist

- [ ] Open app on two different devices/browsers
- [ ] Login as different users on each
- [ ] Send a message from User A to User B
- [ ] Verify on User B's device:
  - [ ] Conversation list updates immediately
  - [ ] Conversation moves to top of list
  - [ ] Last message preview shows new message
  - [ ] Unread count increments
  - [ ] Notification sound plays (if implemented)
- [ ] Open the conversation on User B's device
- [ ] Verify unread count resets to 0
- [ ] Test in group conversations with 3+ users
- [ ] Test when user is offline and comes back online

## API Endpoints Related

### Get User Conversations
```
GET /api/chat/conversations
Authorization: Bearer <token>

Response: Array of conversations with lastMessage and unread_count
```

### Send Message (REST)
```
POST /api/chat/conversations/:id/messages
Authorization: Bearer <token>

Body: { content, messageType, ... }

Side Effect: Emits 'conversation_updated' via Socket.IO
```

### Mark Message as Read
```
PUT /api/chat/messages/:id/read
Authorization: Bearer <token>

Side Effect: Updates unread count
```

## Socket.IO Events Reference

### Events Your Frontend Should Listen To:

| Event | Purpose | When to Use |
|-------|---------|-------------|
| `conversation_updated` | Update conversation list | Always listen when showing conversation list |
| `new_message` | Display message in chat | Listen when user is in an active chat |
| `message_read` | Update read receipts | Listen for read status updates |
| `user_typing` | Show typing indicator | Listen in active chat screen |
| `user_online` | Update online status | Listen for presence updates |
| `user_offline` | Update offline status | Listen for presence updates |

### Events Your Frontend Should Emit:

| Event | Purpose | When to Emit |
|-------|---------|--------------|
| `join_conversation` | Join a conversation room | When user opens a chat |
| `leave_conversation` | Leave a conversation room | When user closes a chat |
| `send_message` | Send a new message | When user sends a message |
| `mark_message_read` | Mark messages as read | When user views a message |
| `typing_start` | Indicate user is typing | When user starts typing |
| `typing_stop` | Stop typing indicator | When user stops typing |

## Performance Tips

1. **Debouncing**: If a conversation is very active, consider debouncing updates (e.g., max once per second)

2. **Virtualized Lists**: Use `FlatList` (React Native) or `react-window` (React Web) for large conversation lists

3. **Memoization**: Use `React.memo()` for conversation list items to prevent unnecessary re-renders

4. **Lazy Loading**: Load older conversations on scroll

5. **Local Optimistic Updates**: Update UI immediately before server confirmation

## Troubleshooting

### Conversation list not updating

1. Check socket connection:
```javascript
socket.on('connect', () => console.log('Connected'));
socket.on('connect_error', (error) => console.error(error));
```

2. Verify you're listening to the event:
```javascript
socket.on('conversation_updated', (data) => {
  console.log('Received update:', data);
});
```

3. Check if user is in the conversation room:
   - Users automatically join all their conversations on connect
   - Check `socket.rooms` on backend

### Unread count not accurate

1. Verify you're not incrementing for your own messages:
```javascript
unread_count: data.lastMessage.sender_id === currentUserId
  ? conv.unread_count  // Don't increment
  : (conv.unread_count || 0) + 1  // Increment
```

2. Reset count when user opens conversation:
```javascript
socket.emit('mark_message_read', { messageId, conversationId });
```

### Messages showing in wrong order

1. Ensure you're sorting by `last_message_at`:
```javascript
conversations.sort((a, b) => 
  new Date(b.last_message_at) - new Date(a.last_message_at)
);
```

## Next Steps

1. ✅ Backend implementation complete
2. 📱 Implement frontend socket listener
3. 🎨 Update conversation list UI
4. 🔔 Add notification sounds
5. 🧪 Test with multiple users
6. 🚀 Deploy and monitor

## Additional Features to Consider

- **Push Notifications**: For offline users
- **Read Receipts**: Show double checkmarks
- **Delivery Status**: Show single checkmark
- **Last Seen**: Show when user was last online
- **Typing Indicators**: Show in conversation list
- **Message Reactions**: Update preview for reactions
- **Pin Conversations**: Keep important chats at top
- **Archive Conversations**: Hide inactive chats
- **Mute Notifications**: Per-conversation mute settings

## Support

For more details, refer to:
- Full documentation: `docs/CONVERSATION_LIST_UPDATE_SOCKET.md`
- Frontend examples: `docs/FRONTEND_CONVERSATION_LIST_EXAMPLE.md`
- Chat implementation: `docs/Frontend_Chat_Implementation_Guide.md`

