# Conversation List Update Flow - Visual Guide

## Complete Flow Diagram

```
┌────────────────────────────────────────────────────────────────────┐
│                        USER A (Sender)                             │
│                                                                    │
│  ┌──────────────┐                                                  │
│  │ Chat Screen  │                                                  │
│  │ with User B  │                                                  │
│  └──────┬───────┘                                                  │
│         │                                                          │
│         │ 1. User types "Hello!" and presses send                  │
│         ▼                                                          │
│  ┌─────────────────────────────────────┐                           │
│  │ socket.emit('send_message', {       │                           │
│  │   conversationId: 123,              │                           │
│  │   content: "Hello!",                │                           │
│  │   messageType: "text"               │                           │
│  │ })                                  │                           │
│  └─────────────┬───────────────────────┘                           │
└────────────────┼───────────────────────────────────────────────────┘
                 │
                 │ WebSocket
                 ▼
┌───────────────────────────────────────────────────────────────────┐
│                         BACKEND SERVER                            │
│                                                                   │
│  ┌─────────────────────────────────────────────────────┐          │
│  │ 2. Socket.IO receives 'send_message' event          │          │
│  │    Location: config/socket.config.js:107            │          │
│  └─────────────┬───────────────────────────────────────┘          │
│                ▼                                                  │
│  ┌─────────────────────────────────────────────────────┐          │
│  │ 3. Call chatService.sendMessage()                   │          │
│  │    Location: services/chatService.js:523            │          │
│  │                                                     │          │
│  │    - Encrypts message content                       │          │
│  │    - Creates message in database                    │          │
│  │    - Updates conversation.last_message_at           │          │
│  │    - Creates message status for all members         │          │
│  └─────────────┬───────────────────────────────────────┘          │
│                ▼                                                  │
│  ┌─────────────────────────────────────────────────────┐          │
│  │ 4. Database Operations                              │          │
│  │                                                     │          │
│  │  INSERT INTO messages (...)                         │          │
│  │  UPDATE conversations                               │          │
│  │    SET last_message_at = NOW()                      │          │
│  │    WHERE id = 123                                   │          │
│  │  INSERT INTO message_status (...) -- For each user  │          │
│  └─────────────┬───────────────────────────────────────┘          │
│                ▼                                                  │
│  ┌─────────────────────────────────────────────────────┐          │
│  │ 5. Emit TWO Socket.IO events to conversation room   │          │
│  │    Location: config/socket.config.js:122-141        │          │
│  │                                                     │          │
│  │  io.to('conversation_123').emit('new_message', {    │          │
│  │    id: 456,                                         │          │
│  │    content: "Hello!",                               │          │
│  │    sender: { id, name, profile },                   │          │
│  │    created_at: "2025-10-11T10:30:00Z"               │          │
│  │  })                                                 │          │
│  │                                                     │          │
│  │  io.to('conversation_123').emit('conversation_updated', {      │
│  │    conversationId: 123,                             │          │
│  │    lastMessage: { ... },                            │          │
│  │    last_message_at: "2025-10-11T10:30:00Z"          │          │
│  │  })                                                 │          │
│  └─────────────┬─────────────────────────────┬─────────┘          │
└────────────────┼─────────────────────────────┼───────────────-────┘
                 │                             │
                 │ WebSocket                   │ WebSocket
                 ▼                             ▼
┌──────────────────────────────────┐  ┌──────────────────────────────────┐
│      USER A (Sender)             │  │      USER B (Receiver)           │
│                                  │  │                                  │
│ ┌──────────────────────────────┐ │  │ ┌──────────────────────────────┐ │
│ │ 6a. Receives 'new_message'   │ │  │ │ 6b. Receives 'new_message'   │ │
│ │                              │ │  │ │                              │ │
│ │ If in chat screen:           │ │  │ │ If in chat screen:           │ │
│ │ - Display message            │ │  │ │ - Display message            │ │
│ │ - No notification sound      │ │  │ │ - Mark as read               │ │
│ │                              │ │  │ │ - Play message sound         │ │
│ └──────────────────────────────┘ │  │ └──────────────────────────────┘ │
│                                  │  │                                  │
│ ┌──────────────────────────────┐ │  │ ┌──────────────────────────────┐ │
│ │ 7a. Receives                 │ │  │ │ 7b. Receives                 │ │
│ │     'conversation_updated'   │ │  │ │     'conversation_updated'   │ │
│ │                              │ │  │ │                              │ │
│ │ Updates conversation list:   │ │  │ │ Updates conversation list:   │ │
│ │                              │ │  │ │                              │ │
│ │ ┌────────────────────────┐   │ │  │ │ ┌────────────────────────┐   │ │
│ │ │ Conversation with B    │   │ │  │ │ │ Conversation with A    │   │ │
│ │ │ You: Hello!            │◄──┼─┼──┼─┼─┤ Hello!                 │   │ │
│ │ │ 10:30 AM               │   │ │  │ │ │ 10:30 AM          [1]  │   │ │
│ │ └────────────────────────┘   │ │  │ │ └────────────────────────┘   │ │
│ │ Other conversations...       │ │  │ │ Other conversations...       │ │
│ │                              │ │  │ │                              │ │
│ │ - Last message updated       │ │  │ │ - Last message updated       │ │
│ │ - Timestamp updated          │ │  │ │ - Timestamp updated          │ │
│ │ - Conversation to top        │ │  │ │ - Conversation to top        │ │
│ │ - Unread count: 0            │ │  │ │ - Unread count: +1           │ │
│ │   (sender doesn't increment) │ │  │ │ - 🔔 Notification sound      │ │
│ └──────────────────────────────┘ │  │ └──────────────────────────────┘ │
└──────────────────────────────────┘  └──────────────────────────────────┘
```

## Detailed Step-by-Step Process

### Step 1: User Action
```
User A clicks send button in chat screen
```

### Step 2: Frontend Emits Event
```javascript
socket.emit('send_message', {
  conversationId: 123,
  content: "Hello!",
  messageType: "text"
});
```

### Step 3: Backend Receives Event
```javascript
// config/socket.config.js:107
socket.on('send_message', async (data) => {
  const result = await chatService.sendMessage({...});
  // ...
});
```

### Step 4: Message Processing
```javascript
// services/chatService.js:523
async sendMessage(data) {
  // 1. Encrypt content
  const encryptedContent = this.encryptMessage(content);
  
  // 2. Create message
  const message = await db.Message.create({...});
  
  // 3. Update conversation timestamp
  await db.Conversation.update(
    { last_message_at: new Date() },
    { where: { id: conversationId } }
  );
  
  // 4. Create message status for all members
  // (determines read/unread status)
}
```

### Step 5: Backend Emits Events
```javascript
// config/socket.config.js:122-141

// Event 1: For active chat screen
io.to(`conversation_${conversationId}`).emit('new_message', {
  id: 456,
  content: "Hello!",
  message_type: "text",
  sender: { id: 1, name: "User A" },
  created_at: "2025-10-11T10:30:00Z"
});

// Event 2: For conversation list (NEW!)
io.to(`conversation_${conversationId}`).emit('conversation_updated', {
  conversationId: 123,
  lastMessage: {
    id: 456,
    content: "Hello!",
    sender_id: 1,
    sender: { id: 1, name: "User A" }
  },
  last_message_at: "2025-10-11T10:30:00Z"
});
```

### Step 6: Frontend Receives Events

#### On Chat Screen Component
```javascript
socket.on('new_message', (message) => {
  // Add message to chat messages
  setMessages(prev => [...prev, message]);
  
  // Scroll to bottom
  scrollToBottom();
  
  // Mark as read if user is viewing
  if (isActiveConversation) {
    socket.emit('mark_message_read', {
      messageId: message.id,
      conversationId: message.conversation_id
    });
  }
});
```

#### On Conversation List Component
```javascript
socket.on('conversation_updated', (data) => {
  setConversations(prevConversations => {
    // Find the conversation
    const updated = prevConversations.map(conv => {
      if (conv.id === data.conversationId) {
        // Determine if sender is current user
        const isMyMessage = data.lastMessage.sender_id === currentUserId;
        
        return {
          ...conv,
          lastMessage: {
            ...data.lastMessage,
            is_sent_by_me: isMyMessage
          },
          last_message_at: data.last_message_at,
          // Only increment unread if from someone else
          unread_count: isMyMessage 
            ? conv.unread_count 
            : (conv.unread_count || 0) + 1
        };
      }
      return conv;
    });
    
    // Re-sort by timestamp
    return updated.sort((a, b) => 
      new Date(b.last_message_at) - new Date(a.last_message_at)
    );
  });
  
  // Play notification sound for messages from others
  if (data.lastMessage.sender_id !== currentUserId) {
    playNotificationSound();
  }
});
```

## State Changes Visualization

### Before Message

```
User B's Conversation List:
┌────────────────────────────────┐
│ Conversation with C            │
│ See you tomorrow               │
│ 09:45 AM                       │
├────────────────────────────────┤
│ Conversation with A            │  ← Will move to top
│ How are you?                   │  ← Will update
│ Yesterday                      │  ← Will update
└────────────────────────────────┘
```

### After Message (User A sends "Hello!")

```
User B's Conversation List:
┌────────────────────────────────┐
│ Conversation with A       [1]  │  ← Moved to top
│ Hello!                         │  ← Updated text
│ 10:30 AM                       │  ← Updated time
├────────────────────────────────┤
│ Conversation with C            │  ← Moved down
│ See you tomorrow               │
│ 09:45 AM                       │
└────────────────────────────────┘
```

## Code Files Reference

### Backend Files (Modified)

1. **`config/socket.config.js`** (Lines 125-141)
   - Added `conversation_updated` event emission
   
2. **`controllers/chatController.js`** (Lines 223-239)
   - Added same event for REST API
   
3. **`services/chatService.js`** (Lines 907-952)
   - Added helper methods

### Frontend Files (To Be Implemented)

1. **Conversation List Component**
   - Listen to `conversation_updated` event
   - Update local state
   - Re-sort conversations
   
2. **Chat Screen Component**
   - Listen to `new_message` event (already exists)
   - Mark messages as read

## Event Comparison

### `new_message` Event
- **Purpose**: Display message in active chat
- **Payload**: Full message object with all details
- **Used By**: Chat screen component
- **Action**: Append to messages list

### `conversation_updated` Event (NEW!)
- **Purpose**: Update conversation list
- **Payload**: Conversation metadata + last message
- **Used By**: Conversation list component
- **Action**: Update conversation item and re-sort

## Room Membership

All conversation members automatically join the conversation room on connection:

```javascript
// On socket connection (socket.config.js:66-70)
const userConversations = await chatService.getUserConversations(socket.userId);
userConversations.forEach(conversation => {
  socket.join(`conversation_${conversation.id}`);
});
```

This ensures that:
- Events are only sent to conversation members
- No manual room joining needed
- Efficient broadcasting

## Summary

✅ **Backend**: Fully implemented - emits `conversation_updated` event  
📱 **Frontend**: Needs implementation - listen and update UI  
📚 **Docs**: Complete guides available in `/docs` folder  
🧪 **Testing**: Ready to test with multiple users  

## Next Steps

1. Implement frontend listener for `conversation_updated`
2. Update conversation list UI when event received
3. Test with multiple users and devices
4. Add notification sounds and badges
5. Deploy and monitor performance

## Additional Resources

- **Quick Start**: `docs/CONVERSATION_LIST_UPDATE_QUICK_START.md`
- **Full Documentation**: `docs/CONVERSATION_LIST_UPDATE_SOCKET.md`
- **Frontend Examples**: `docs/FRONTEND_CONVERSATION_LIST_EXAMPLE.md`
- **Summary**: `docs/CONVERSATION_LIST_UPDATE_SUMMARY.md`

