# Mark Messages as Read - Complete Guide

## Overview

When a user with 5 unread messages opens a conversation, the frontend should mark those messages as read. This guide shows you how to implement this on the frontend.

## Backend APIs Available

### 1. Socket.IO Events (Recommended for real-time)

#### Mark Single Message
```javascript
socket.emit('mark_message_read', {
  messageId: 123,
  conversationId: 456
});
```

#### Mark All Messages in Conversation (NEW! ✨)
```javascript
socket.emit('mark_conversation_read', {
  conversationId: 456
});
```

### 2. REST API Endpoints

#### Mark Single Message
```http
PUT /api/chat/messages/:messageId/read
Authorization: Bearer <token>
```

#### Mark All Messages in Conversation (NEW! ✨)
```http
PUT /api/chat/conversations/:conversationId/read
Authorization: Bearer <token>
```

## Frontend Implementation

### React/React Native - Complete Example

```javascript
import React, { useState, useEffect, useRef } from 'react';
import { View, FlatList, Text } from 'react-native';
import io from 'socket.io-client';

const ChatScreen = ({ route, navigation }) => {
  const { conversationId } = route.params;
  const [messages, setMessages] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const socket = useRef(null);
  const currentUserId = getUserId(); // Your auth function
  const isScreenFocused = useRef(false);
  const hasMarkedAsRead = useRef(false);

  // Initialize socket
  useEffect(() => {
    socket.current = io(API_URL, {
      auth: { token: getAuthToken() }
    });

    return () => {
      socket.current?.disconnect();
    };
  }, []);

  // Fetch messages when screen loads
  useEffect(() => {
    fetchMessages();
  }, [conversationId]);

  // Mark messages as read when screen becomes focused
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      isScreenFocused.current = true;
      markConversationAsRead();
    });

    const blurUnsubscribe = navigation.addListener('blur', () => {
      isScreenFocused.current = false;
      hasMarkedAsRead.current = false;
    });

    return () => {
      unsubscribe();
      blurUnsubscribe();
    };
  }, [navigation, conversationId]);

  // Listen for new messages
  useEffect(() => {
    if (!socket.current) return;

    socket.current.on('new_message', (message) => {
      if (message.conversation_id === conversationId) {
        // Add message to list
        setMessages(prev => [...prev, message]);

        // Mark as read if user is viewing the screen
        if (isScreenFocused.current && message.sender_id !== currentUserId) {
          markMessageAsRead(message.id);
        }
      }
    });

    // Listen for read confirmations
    socket.current.on('conversation_marked_read', (data) => {
      console.log(`Marked ${data.messageCount} messages as read`);
      setUnreadCount(0);
    });

    return () => {
      socket.current?.off('new_message');
      socket.current?.off('conversation_marked_read');
    };
  }, [conversationId, currentUserId]);

  const fetchMessages = async () => {
    try {
      const response = await fetch(
        `${API_URL}/api/chat/conversations/${conversationId}/messages`,
        {
          headers: {
            'Authorization': `Bearer ${getAuthToken()}`
          }
        }
      );
      const data = await response.json();
      
      if (data.success) {
        setMessages(data.data.messages);
        
        // Count unread messages
        const unread = data.data.messages.filter(
          msg => msg.sender_id !== currentUserId && 
                 !msg.statuses.find(s => s.user_id === currentUserId && s.status === 'read')
        ).length;
        setUnreadCount(unread);

        // Mark as read after loading
        if (unread > 0) {
          setTimeout(() => markConversationAsRead(), 500);
        }
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  // ✅ Method 1: Mark all messages in conversation (RECOMMENDED)
  const markConversationAsRead = () => {
    if (hasMarkedAsRead.current || unreadCount === 0) return;
    
    hasMarkedAsRead.current = true;

    // Via Socket.IO (Real-time)
    socket.current?.emit('mark_conversation_read', {
      conversationId
    });

    // Update local state immediately (optimistic update)
    setUnreadCount(0);
    updateConversationListUnreadCount(conversationId, 0);
  };

  // ✅ Method 2: Mark single message (for individual messages)
  const markMessageAsRead = (messageId) => {
    socket.current?.emit('mark_message_read', {
      messageId,
      conversationId
    });
  };

  // Update conversation list unread count
  const updateConversationListUnreadCount = (convId, count) => {
    // This would update your conversation list context/state
    // ConversationListContext.updateUnreadCount(convId, count);
  };

  const renderMessage = ({ item }) => (
    <View style={styles.messageContainer}>
      <Text>{item.content}</Text>
      <Text style={styles.timestamp}>
        {new Date(item.created_at).toLocaleTimeString()}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => item.id.toString()}
      />
      {/* Your message input component */}
    </View>
  );
};

export default ChatScreen;
```

## Different Strategies

### Strategy 1: Mark as Read on Screen Load (✅ Recommended)

```javascript
useEffect(() => {
  // When user opens conversation, mark all unread as read
  const markAsRead = async () => {
    await new Promise(resolve => setTimeout(resolve, 500)); // Small delay
    socket.emit('mark_conversation_read', { conversationId });
  };

  markAsRead();
}, [conversationId]);
```

**Pros:**
- ✅ Simple and straightforward
- ✅ Marks everything immediately
- ✅ Good user experience

**Cons:**
- ⚠️ Marks as read even if user doesn't scroll to see all messages

### Strategy 2: Mark as Read When Message is Visible

```javascript
import { useInView } from 'react-intersection-observer';

const MessageItem = ({ message, onVisible }) => {
  const { ref, inView } = useInView({
    threshold: 0.5, // 50% of message must be visible
    triggerOnce: true
  });

  useEffect(() => {
    if (inView && !message.isRead) {
      onVisible(message.id);
    }
  }, [inView, message.id]);

  return <div ref={ref}>{message.content}</div>;
};

// In parent component
const handleMessageVisible = (messageId) => {
  socket.emit('mark_message_read', { messageId, conversationId });
};
```

**Pros:**
- ✅ Only marks when user actually sees the message
- ✅ More accurate read receipts

**Cons:**
- ⚠️ More complex implementation
- ⚠️ Requires intersection observer
- ⚠️ May cause multiple API calls

### Strategy 3: Mark as Read on Screen Focus

```javascript
import { useIsFocused } from '@react-navigation/native';

const ChatScreen = () => {
  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) {
      // User returned to this screen, mark as read
      socket.emit('mark_conversation_read', { conversationId });
    }
  }, [isFocused, conversationId]);

  return <View>...</View>;
};
```

**Pros:**
- ✅ Marks when user actually views the screen
- ✅ Handles app backgrounding/foregrounding

**Cons:**
- ⚠️ Triggers on every focus (might be excessive)

### Strategy 4: Debounced Mark as Read

```javascript
import { useCallback } from 'react';
import debounce from 'lodash.debounce';

const ChatScreen = () => {
  const markAsReadDebounced = useCallback(
    debounce((convId) => {
      socket.emit('mark_conversation_read', { conversationId: convId });
    }, 1000), // Wait 1 second after last scroll
    []
  );

  const handleScroll = () => {
    markAsReadDebounced(conversationId);
  };

  return (
    <FlatList
      data={messages}
      onScroll={handleScroll}
      // ...
    />
  );
};
```

**Pros:**
- ✅ Prevents excessive API calls
- ✅ Waits until user stops scrolling

**Cons:**
- ⚠️ Delayed read receipts
- ⚠️ More complex

## Recommended Implementation (Best Practice)

```javascript
import React, { useState, useEffect, useRef } from 'react';
import { View, FlatList, AppState } from 'react-native';

const ChatScreen = ({ route }) => {
  const { conversationId } = route.params;
  const [messages, setMessages] = useState([]);
  const socket = useRef(null);
  const appState = useRef(AppState.currentState);
  const hasMarkedAsRead = useRef(false);

  useEffect(() => {
    // Fetch messages
    fetchMessages().then(() => {
      // Mark as read after a short delay (to ensure messages are visible)
      setTimeout(() => {
        markAsReadIfNeeded();
      }, 800);
    });

    // Handle app state changes
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription?.remove();
    };
  }, [conversationId]);

  const handleAppStateChange = (nextAppState) => {
    if (
      appState.current.match(/inactive|background/) &&
      nextAppState === 'active'
    ) {
      // App came to foreground while on this screen
      markAsReadIfNeeded();
    }
    appState.current = nextAppState;
  };

  const markAsReadIfNeeded = () => {
    if (hasMarkedAsRead.current) return;

    socket.current?.emit('mark_conversation_read', {
      conversationId
    });

    hasMarkedAsRead.current = true;

    // Update conversation list
    updateConversationUnreadCount(conversationId, 0);
  };

  const fetchMessages = async () => {
    const response = await fetch(
      `${API_URL}/api/chat/conversations/${conversationId}/messages`,
      {
        headers: { 'Authorization': `Bearer ${getAuthToken()}` }
      }
    );
    const data = await response.json();
    if (data.success) {
      setMessages(data.data.messages);
    }
  };

  const updateConversationUnreadCount = (convId, count) => {
    // Update your conversation list state/context
    // This ensures the conversation list UI updates immediately
    // Example: ConversationContext.updateUnreadCount(convId, count);
  };

  // Listen for new messages
  useEffect(() => {
    socket.current?.on('new_message', (message) => {
      if (message.conversation_id === conversationId) {
        setMessages(prev => [...prev, message]);
        
        // Mark new message as read if user is viewing
        if (message.sender_id !== currentUserId) {
          socket.current?.emit('mark_message_read', {
            messageId: message.id,
            conversationId
          });
        }
      }
    });

    return () => {
      socket.current?.off('new_message');
    };
  }, [conversationId]);

  return (
    <View style={styles.container}>
      <FlatList
        data={messages}
        renderItem={({ item }) => <MessageItem message={item} />}
        keyExtractor={item => item.id.toString()}
      />
    </View>
  );
};

export default ChatScreen;
```

## Update Conversation List

When marking messages as read, you should also update the conversation list to remove the unread badge:

```javascript
// In your Conversation List Context or State Management

// Method 1: Using Context
const ConversationContext = createContext();

export const ConversationProvider = ({ children }) => {
  const [conversations, setConversations] = useState([]);

  const updateUnreadCount = (conversationId, count) => {
    setConversations(prev =>
      prev.map(conv =>
        conv.id === conversationId
          ? { ...conv, unread_count: count }
          : conv
      )
    );
  };

  return (
    <ConversationContext.Provider value={{ conversations, updateUnreadCount }}>
      {children}
    </ConversationContext.Provider>
  );
};

// Method 2: Using Redux
export const markConversationAsReadAction = (conversationId) => ({
  type: 'MARK_CONVERSATION_AS_READ',
  payload: { conversationId }
});

const conversationReducer = (state, action) => {
  switch (action.type) {
    case 'MARK_CONVERSATION_AS_READ':
      return {
        ...state,
        conversations: state.conversations.map(conv =>
          conv.id === action.payload.conversationId
            ? { ...conv, unread_count: 0 }
            : conv
        )
      };
    default:
      return state;
  }
};
```

## REST API Alternative

If you prefer REST API over Socket.IO:

```javascript
const markConversationAsRead = async () => {
  try {
    const response = await fetch(
      `${API_URL}/api/chat/conversations/${conversationId}/read`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const data = await response.json();
    
    if (data.success) {
      console.log(`Marked ${data.data.messageCount} messages as read`);
      setUnreadCount(0);
      updateConversationList(conversationId, 0);
    }
  } catch (error) {
    console.error('Error marking as read:', error);
  }
};
```

## Complete Flow Diagram

```
User opens conversation with 5 unread messages
       ↓
Frontend loads messages and displays them
       ↓
After 800ms delay (ensures UI is ready)
       ↓
Frontend emits 'mark_conversation_read'
       ↓
Backend receives event
       ↓
Backend updates MessageStatus table:
  - Finds all unread messages for this user
  - Sets status = 'read'
  - Sets read_at = NOW()
       ↓
Backend emits 'conversation_read' to other users (read receipt)
       ↓
Backend confirms to sender: 'conversation_marked_read'
       ↓
Frontend updates:
  ├─→ Unread count = 0
  ├─→ Conversation list badge removed
  └─→ Read receipts updated (if applicable)
```

## Event Listeners

Don't forget to listen for read receipt events from other users:

```javascript
useEffect(() => {
  socket.on('conversation_read', (data) => {
    console.log(`User ${data.userId} read ${data.messageCount} messages`);
    
    // Update UI to show read receipts
    // For example, show double checkmarks on your sent messages
    setMessages(prev =>
      prev.map(msg => ({
        ...msg,
        read_by: msg.read_by 
          ? [...msg.read_by, data.userId]
          : [data.userId]
      }))
    );
  });

  return () => {
    socket.off('conversation_read');
  };
}, []);
```

## Summary

✅ **Backend**: Fully implemented - both single and bulk mark as read  
📱 **Frontend**: Use the recommended implementation above  
🎯 **Best Practice**: Mark as read on screen load with 800ms delay  
⚡ **Performance**: Bulk operation marks all messages in one query  
🔔 **Real-time**: Socket.IO for instant updates, REST API as fallback  

## Testing Checklist

- [ ] User opens conversation with unread messages
- [ ] Unread count badge disappears
- [ ] Database shows status = 'read' for those messages
- [ ] Other user sees read receipts (if implemented)
- [ ] New messages are marked as read automatically
- [ ] Works when app is backgrounded and brought back
- [ ] Works on slow networks (with retry logic)
- [ ] Conversation list unread count updates immediately

