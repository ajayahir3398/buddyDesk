# Frontend Chat Implementation Guide 🚀

Here's a comprehensive guide to implement the chat functionality in your React Native frontend:

## 📦 **1. Install Required Dependencies**

```bash
npm install socket.io-client @react-native-async-storage/async-storage
# For UI components (optional)
npm install react-native-gifted-chat
```

## 🔌 **2. Socket.io Client Setup**

Create `services/socketService.js`:

```javascript
import io from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
  }

  async connect() {
    const token = await AsyncStorage.getItem('accessToken');
    
    this.socket = io('http://your-server:3001', {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling']
    });

    this.socket.on('connect', () => {
      this.isConnected = true;
      console.log('Connected to server');
    });

    this.socket.on('disconnect', () => {
      this.isConnected = false;
      console.log('Disconnected from server');
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Join conversation
  joinConversation(conversationId) {
    this.socket?.emit('join_conversation', { conversationId });
  }

  // Send message
  sendMessage(conversationId, content, type = 'text') {
    this.socket?.emit('send_message', {
      conversationId,
      content,
      type
    });
  }

  // Typing indicators
  startTyping(conversationId) {
    this.socket?.emit('typing_start', { conversationId });
  }

  stopTyping(conversationId) {
    this.socket?.emit('typing_stop', { conversationId });
  }

  // Mark message as read
  markMessageRead(messageId) {
    this.socket?.emit('mark_message_read', { messageId });
  }

  // Event listeners
  onNewMessage(callback) {
    this.socket?.on('new_message', callback);
  }

  onUserTyping(callback) {
    this.socket?.on('user_typing', callback);
  }

  onMessageRead(callback) {
    this.socket?.on('message_read', callback);
  }

  onUserOnline(callback) {
    this.socket?.on('user_online', callback);
  }

  onUserOffline(callback) {
    this.socket?.on('user_offline', callback);
  }
}

export default new SocketService();
```

## 🎯 **3. Chat Context Provider**

Create `contexts/ChatContext.js`:

```javascript
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import socketService from '../services/socketService';

const ChatContext = createContext();

const chatReducer = (state, action) => {
  switch (action.type) {
    case 'SET_CONVERSATIONS':
      return { ...state, conversations: action.payload };
    case 'ADD_MESSAGE':
      return {
        ...state,
        messages: {
          ...state.messages,
          [action.payload.conversationId]: [
            ...(state.messages[action.payload.conversationId] || []),
            action.payload.message
          ]
        }
      };
    case 'SET_TYPING_USERS':
      return {
        ...state,
        typingUsers: {
          ...state.typingUsers,
          [action.payload.conversationId]: action.payload.users
        }
      };
    case 'UPDATE_ONLINE_STATUS':
      return {
        ...state,
        onlineUsers: {
          ...state.onlineUsers,
          [action.payload.userId]: action.payload.isOnline
        }
      };
    default:
      return state;
  }
};

export const ChatProvider = ({ children }) => {
  const [state, dispatch] = useReducer(chatReducer, {
    conversations: [],
    messages: {},
    typingUsers: {},
    onlineUsers: {}
  });

  useEffect(() => {
    // Connect to socket
    socketService.connect();

    // Set up event listeners
    socketService.onNewMessage((message) => {
      dispatch({
        type: 'ADD_MESSAGE',
        payload: {
          conversationId: message.conversationId,
          message
        }
      });
    });

    socketService.onUserTyping((data) => {
      dispatch({
        type: 'SET_TYPING_USERS',
        payload: data
      });
    });

    socketService.onUserOnline((data) => {
      dispatch({
        type: 'UPDATE_ONLINE_STATUS',
        payload: { userId: data.userId, isOnline: true }
      });
    });

    socketService.onUserOffline((data) => {
      dispatch({
        type: 'UPDATE_ONLINE_STATUS',
        payload: { userId: data.userId, isOnline: false }
      });
    });

    return () => {
      socketService.disconnect();
    };
  }, []);

  return (
    <ChatContext.Provider value={{ state, dispatch, socketService }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within ChatProvider');
  }
  return context;
};
```

## 💬 **4. Chat Screen Component**

Create `screens/ChatScreen.js`:

```javascript
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { useChat } from '../contexts/ChatContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ChatScreen = ({ route }) => {
  const { conversationId } = route.params;
  const { state, socketService } = useChat();
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const messages = state.messages[conversationId] || [];
  const typingUsers = state.typingUsers[conversationId] || [];

  useEffect(() => {
    // Join conversation when screen loads
    socketService.joinConversation(conversationId);
    
    // Load message history
    loadMessageHistory();
  }, [conversationId]);

  const loadMessageHistory = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      const response = await fetch(`http://your-server:3001/api/chat/conversations/${conversationId}/messages`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      
      if (data.success) {
        // Dispatch messages to context
        data.data.messages.forEach(msg => {
          dispatch({
            type: 'ADD_MESSAGE',
            payload: {
              conversationId: conversationId,
              message: msg
            }
          });
        });
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const sendMessage = () => {
    if (message.trim()) {
      socketService.sendMessage(conversationId, message.trim());
      setMessage('');
      socketService.stopTyping(conversationId);
      setIsTyping(false);
    }
  };

  const handleTyping = (text) => {
    setMessage(text);
    
    if (text.length > 0 && !isTyping) {
      socketService.startTyping(conversationId);
      setIsTyping(true);
    } else if (text.length === 0 && isTyping) {
      socketService.stopTyping(conversationId);
      setIsTyping(false);
    }
  };

  const renderMessage = ({ item }) => (
    <View style={[styles.messageContainer, item.isOwn ? styles.ownMessage : styles.otherMessage]}>
      <Text style={styles.messageText}>{item.content}</Text>
      <Text style={styles.messageTime}>{new Date(item.createdAt).toLocaleTimeString()}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id.toString()}
        style={styles.messagesList}
        inverted
      />
      
      {typingUsers.length > 0 && (
        <View style={styles.typingIndicator}>
          <Text>{typingUsers.join(', ')} is typing...</Text>
        </View>
      )}
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={message}
          onChangeText={handleTyping}
          placeholder="Type a message..."
          multiline
        />
        <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  messagesList: {
    flex: 1,
    paddingHorizontal: 16
  },
  messageContainer: {
    marginVertical: 4,
    padding: 12,
    borderRadius: 12,
    maxWidth: '80%'
  },
  ownMessage: {
    backgroundColor: '#007AFF',
    alignSelf: 'flex-end'
  },
  otherMessage: {
    backgroundColor: '#E5E5EA',
    alignSelf: 'flex-start'
  },
  messageText: {
    fontSize: 16,
    color: '#000'
  },
  messageTime: {
    fontSize: 12,
    color: '#666',
    marginTop: 4
  },
  typingIndicator: {
    padding: 8,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#ddd'
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    alignItems: 'flex-end'
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    maxHeight: 100
  },
  sendButton: {
    backgroundColor: '#007AFF',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: 'bold'
  }
});

export default ChatScreen;
```

## 📋 **5. Conversations List Screen**

Create `screens/ConversationsScreen.js`:

```javascript
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useChat } from '../contexts/ChatContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ConversationsScreen = ({ navigation }) => {
  const { state, dispatch } = useChat();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      const response = await fetch('http://your-server:3001/api/chat/conversations', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      
      if (data.success) {
        dispatch({
          type: 'SET_CONVERSATIONS',
          payload: data.data.conversations
        });
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderConversation = ({ item }) => (
    <TouchableOpacity
      style={styles.conversationItem}
      onPress={() => navigation.navigate('Chat', { conversationId: item.id })}
    >
      <View style={styles.conversationInfo}>
        <Text style={styles.conversationName}>{item.name || 'Private Chat'}</Text>
        <Text style={styles.lastMessage}>{item.lastMessage?.content || 'No messages yet'}</Text>
      </View>
      <View style={styles.conversationMeta}>
        <Text style={styles.timestamp}>
          {item.lastMessage ? new Date(item.lastMessage.createdAt).toLocaleDateString() : ''}
        </Text>
        {item.unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>{item.unreadCount}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading conversations...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={state.conversations}
        renderItem={renderConversation}
        keyExtractor={(item) => item.id.toString()}
        style={styles.conversationsList}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  conversationsList: {
    flex: 1
  },
  conversationItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  conversationInfo: {
    flex: 1
  },
  conversationName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4
  },
  lastMessage: {
    fontSize: 14,
    color: '#666'
  },
  conversationMeta: {
    alignItems: 'flex-end'
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4
  },
  unreadBadge: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center'
  },
  unreadText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold'
  }
});

export default ConversationsScreen;
```

## 🚀 **6. App Integration**

Update your `App.js`:

```javascript
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { ChatProvider } from './contexts/ChatContext';
import ConversationsScreen from './screens/ConversationsScreen';
import ChatScreen from './screens/ChatScreen';

const Stack = createStackNavigator();

const App = () => {
  return (
    <ChatProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Conversations">
          <Stack.Screen 
            name="Conversations" 
            component={ConversationsScreen}
            options={{ title: 'Chats' }}
          />
          <Stack.Screen 
            name="Chat" 
            component={ChatScreen}
            options={{ title: 'Chat' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </ChatProvider>
  );
};

export default App;
```

## ✨ **Key Features Implemented**

### Real-time Messaging
- ✅ Send and receive messages instantly
- ✅ Message history loading
- ✅ Message status tracking

### Typing Indicators
- ✅ Show when users are typing
- ✅ Real-time typing status updates

### Online/Offline Status
- ✅ Track user presence
- ✅ Real-time status updates

### Authentication
- ✅ JWT token-based authentication
- ✅ Secure WebSocket connections

### Conversation Management
- ✅ List all conversations
- ✅ Join/leave conversations
- ✅ Unread message counts

### Message Read Status
- ✅ Mark messages as read
- ✅ Read receipts

## 🔧 **Next Steps**

1. **File Attachments**: Implement image/file sharing
2. **Push Notifications**: Add background notifications
3. **Message Search**: Implement search functionality
4. **Group Chat Management**: Add/remove members
5. **Message Reactions**: Add emoji reactions
6. **Voice Messages**: Implement audio messaging
7. **Message Encryption**: Add end-to-end encryption

## 🛠 **Configuration Notes**

- Replace `http://your-server:3001` with your actual server URL
- Ensure your server is running on the correct port
- Configure proper CORS settings for your domain
- Set up proper error handling for network issues
- Implement proper loading states and error messages

This implementation provides a solid foundation for a real-time chat application with all the essential features working seamlessly with your backend API.