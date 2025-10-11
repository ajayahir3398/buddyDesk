# Frontend Implementation Examples for Conversation List Updates

## React/React Native Implementation

### Complete Example with Hooks

```javascript
import React, { useState, useEffect, useCallback } from 'react';
import io from 'socket.io-client';

const ConversationList = () => {
  const [conversations, setConversations] = useState([]);
  const [socket, setSocket] = useState(null);
  const [loading, setLoading] = useState(true);
  const currentUserId = getUserId(); // Your auth function

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io(process.env.REACT_APP_API_URL, {
      auth: {
        token: getAuthToken() // Your auth token
      },
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      console.log('Socket connected');
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Fetch initial conversations
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/chat/conversations`, {
          headers: {
            'Authorization': `Bearer ${getAuthToken()}`
          }
        });
        const data = await response.json();
        
        if (data.success) {
          setConversations(data.data);
        }
      } catch (error) {
        console.error('Error fetching conversations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, []);

  // Handle conversation updates via Socket.IO
  useEffect(() => {
    if (!socket) return;

    // Listen for conversation updates
    const handleConversationUpdate = (data) => {
      console.log('Conversation updated:', data);
      
      setConversations(prevConversations => {
        // Check if conversation already exists in the list
        const existingIndex = prevConversations.findIndex(
          conv => conv.id === data.conversationId
        );

        let updatedConversations;

        if (existingIndex !== -1) {
          // Update existing conversation
          updatedConversations = prevConversations.map((conv, index) => {
            if (index === existingIndex) {
              return {
                ...conv,
                lastMessage: {
                  ...data.lastMessage,
                  is_sent_by_me: data.lastMessage.sender_id === currentUserId
                },
                last_message_at: data.last_message_at,
                // Increment unread count only if message is from someone else
                unread_count: data.lastMessage.sender_id === currentUserId 
                  ? conv.unread_count 
                  : (conv.unread_count || 0) + 1
              };
            }
            return conv;
          });
        } else {
          // New conversation - fetch full details
          fetchConversationDetails(data.conversationId);
          return prevConversations;
        }

        // Sort by last_message_at (most recent first)
        return updatedConversations.sort((a, b) => 
          new Date(b.last_message_at) - new Date(a.last_message_at)
        );
      });

      // Play notification sound if message is from someone else
      if (data.lastMessage.sender_id !== currentUserId) {
        playNotificationSound();
      }
    };

    // Listen for new messages (for active chats)
    const handleNewMessage = (message) => {
      console.log('New message:', message);
      // This is handled by the chat screen component
      // But we can also update unread count if user is not in that chat
    };

    // Listen for read receipts
    const handleMessageRead = (data) => {
      // Update message read status if needed
      console.log('Message read:', data);
    };

    // Listen for unread count updates
    const handleUnreadCountUpdate = (data) => {
      setConversations(prevConversations => 
        prevConversations.map(conv => 
          conv.id === data.conversationId 
            ? { ...conv, unread_count: data.unreadCount }
            : conv
        )
      );
    };

    socket.on('conversation_updated', handleConversationUpdate);
    socket.on('new_message', handleNewMessage);
    socket.on('message_read', handleMessageRead);
    socket.on('unread_count_updated', handleUnreadCountUpdate);

    return () => {
      socket.off('conversation_updated', handleConversationUpdate);
      socket.off('new_message', handleNewMessage);
      socket.off('message_read', handleMessageRead);
      socket.off('unread_count_updated', handleUnreadCountUpdate);
    };
  }, [socket, currentUserId]);

  // Fetch single conversation details
  const fetchConversationDetails = async (conversationId) => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/chat/conversations/${conversationId}`,
        {
          headers: {
            'Authorization': `Bearer ${getAuthToken()}`
          }
        }
      );
      const data = await response.json();
      
      if (data.success) {
        setConversations(prev => {
          // Check if already exists
          if (prev.find(c => c.id === conversationId)) {
            return prev;
          }
          // Add new conversation and sort
          return [...prev, data.data].sort((a, b) => 
            new Date(b.last_message_at) - new Date(a.last_message_at)
          );
        });
      }
    } catch (error) {
      console.error('Error fetching conversation:', error);
    }
  };

  // Mark conversation as read when user opens it
  const handleConversationClick = async (conversation) => {
    // Navigate to chat screen
    navigation.navigate('Chat', { conversationId: conversation.id });
    
    // Reset unread count locally (will be confirmed by server)
    setConversations(prev => 
      prev.map(conv => 
        conv.id === conversation.id 
          ? { ...conv, unread_count: 0 }
          : conv
      )
    );
  };

  const playNotificationSound = () => {
    // Implement notification sound
    // For React Native: use expo-av or react-native-sound
    // For Web: new Audio('/notification.mp3').play()
  };

  if (loading) {
    return <div>Loading conversations...</div>;
  }

  return (
    <div className="conversation-list">
      {conversations.length === 0 ? (
        <div className="empty-state">No conversations yet</div>
      ) : (
        conversations.map(conversation => (
          <ConversationItem
            key={conversation.id}
            conversation={conversation}
            currentUserId={currentUserId}
            onClick={() => handleConversationClick(conversation)}
          />
        ))
      )}
    </div>
  );
};

// Conversation Item Component
const ConversationItem = ({ conversation, currentUserId, onClick }) => {
  const otherMember = conversation.members?.find(
    m => m.user_id !== currentUserId
  )?.user;

  const displayName = conversation.type === 'group' 
    ? conversation.name 
    : otherMember?.name || 'Unknown';

  const displayImage = conversation.type === 'group'
    ? conversation.avatar_url
    : otherMember?.profile?.image_url;

  const lastMessage = conversation.lastMessage;
  const lastMessageText = lastMessage
    ? lastMessage.is_sent_by_me
      ? `You: ${lastMessage.content}`
      : lastMessage.content
    : 'No messages yet';

  return (
    <div 
      className={`conversation-item ${conversation.unread_count > 0 ? 'unread' : ''}`}
      onClick={onClick}
    >
      <div className="avatar">
        <img src={displayImage || '/default-avatar.png'} alt={displayName} />
        {otherMember?.is_online && <div className="online-indicator" />}
      </div>
      
      <div className="conversation-details">
        <div className="header">
          <h3 className="name">{displayName}</h3>
          <span className="time">
            {formatTime(conversation.last_message_at)}
          </span>
        </div>
        
        <div className="last-message">
          <p className="message-preview">
            {lastMessage?.message_type === 'text' 
              ? lastMessageText 
              : `📎 ${lastMessage?.message_type || 'Attachment'}`
            }
          </p>
          {conversation.unread_count > 0 && (
            <span className="unread-badge">
              {conversation.unread_count}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper function to format time
const formatTime = (timestamp) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInHours = (now - date) / (1000 * 60 * 60);

  if (diffInHours < 24) {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit' 
    });
  } else if (diffInHours < 48) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  }
};

export default ConversationList;
```

### React Native (Expo) Implementation

```javascript
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator
} from 'react-native';
import io from 'socket.io-client';
import { Audio } from 'expo-av';

const ConversationListScreen = ({ navigation }) => {
  const [conversations, setConversations] = useState([]);
  const [socket, setSocket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sound, setSound] = useState(null);
  
  const currentUserId = useAuth().userId; // Your auth hook

  // Initialize socket
  useEffect(() => {
    const newSocket = io(process.env.API_URL, {
      auth: {
        token: getAuthToken()
      }
    });

    newSocket.on('connect', () => {
      console.log('Connected to chat server');
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Load notification sound
  useEffect(() => {
    async function loadSound() {
      const { sound } = await Audio.Sound.createAsync(
        require('./assets/notification.mp3')
      );
      setSound(sound);
    }
    loadSound();

    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);

  // Fetch conversations
  useEffect(() => {
    fetchConversations();
  }, []);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    socket.on('conversation_updated', (data) => {
      handleConversationUpdate(data);
    });

    socket.on('new_message', (message) => {
      // Handle if needed
    });

    return () => {
      socket.off('conversation_updated');
      socket.off('new_message');
    };
  }, [socket, currentUserId]);

  const fetchConversations = async () => {
    try {
      const response = await fetch(`${process.env.API_URL}/api/chat/conversations`, {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      });
      const data = await response.json();
      
      if (data.success) {
        setConversations(data.data);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConversationUpdate = async (data) => {
    setConversations(prevConversations => {
      const existingIndex = prevConversations.findIndex(
        conv => conv.id === data.conversationId
      );

      let updated;

      if (existingIndex !== -1) {
        updated = prevConversations.map((conv, index) => {
          if (index === existingIndex) {
            const isMyMessage = data.lastMessage.sender_id === currentUserId;
            return {
              ...conv,
              lastMessage: {
                ...data.lastMessage,
                is_sent_by_me: isMyMessage
              },
              last_message_at: data.last_message_at,
              unread_count: isMyMessage 
                ? conv.unread_count 
                : (conv.unread_count || 0) + 1
            };
          }
          return conv;
        });
      } else {
        // Fetch new conversation details
        fetchConversations();
        return prevConversations;
      }

      // Sort by timestamp
      const sorted = updated.sort((a, b) => 
        new Date(b.last_message_at) - new Date(a.last_message_at)
      );

      // Play sound for new messages from others
      if (data.lastMessage.sender_id !== currentUserId && sound) {
        sound.replayAsync();
      }

      return sorted;
    });
  };

  const handleConversationPress = (conversation) => {
    // Navigate to chat screen
    navigation.navigate('Chat', { 
      conversationId: conversation.id,
      conversationName: getConversationName(conversation)
    });

    // Reset unread count
    setConversations(prev => 
      prev.map(conv => 
        conv.id === conversation.id 
          ? { ...conv, unread_count: 0 }
          : conv
      )
    );
  };

  const getConversationName = (conversation) => {
    if (conversation.type === 'group') {
      return conversation.name;
    }
    const otherMember = conversation.members?.find(
      m => m.user_id !== currentUserId
    );
    return otherMember?.user?.name || 'Unknown';
  };

  const renderConversation = ({ item }) => {
    const otherMember = item.type === 'private'
      ? item.members?.find(m => m.user_id !== currentUserId)?.user
      : null;

    const displayName = getConversationName(item);
    const displayImage = item.type === 'group'
      ? item.avatar_url
      : otherMember?.profile?.image_url;

    const lastMessage = item.lastMessage;
    const messagePreview = lastMessage
      ? lastMessage.message_type === 'text'
        ? lastMessage.is_sent_by_me 
          ? `You: ${lastMessage.content}`
          : lastMessage.content
        : `📎 ${lastMessage.message_type}`
      : 'No messages yet';

    return (
      <TouchableOpacity 
        style={[
          styles.conversationItem,
          item.unread_count > 0 && styles.unreadConversation
        ]}
        onPress={() => handleConversationPress(item)}
      >
        <View style={styles.avatarContainer}>
          <Image
            source={{ uri: displayImage || 'https://via.placeholder.com/50' }}
            style={styles.avatar}
          />
          {otherMember?.is_online && (
            <View style={styles.onlineIndicator} />
          )}
        </View>

        <View style={styles.conversationDetails}>
          <View style={styles.header}>
            <Text style={styles.name} numberOfLines={1}>
              {displayName}
            </Text>
            <Text style={styles.time}>
              {formatTime(item.last_message_at)}
            </Text>
          </View>

          <View style={styles.lastMessageRow}>
            <Text 
              style={[
                styles.messagePreview,
                item.unread_count > 0 && styles.unreadText
              ]} 
              numberOfLines={1}
            >
              {messagePreview}
            </Text>
            {item.unread_count > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>
                  {item.unread_count > 99 ? '99+' : item.unread_count}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={conversations}
        renderItem={renderConversation}
        keyExtractor={item => item.id.toString()}
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text style={styles.emptyText}>No conversations yet</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  conversationItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    backgroundColor: '#fff'
  },
  unreadConversation: {
    backgroundColor: '#F7F7F8'
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#4CD964',
    borderWidth: 2,
    borderColor: '#fff'
  },
  conversationDetails: {
    flex: 1,
    justifyContent: 'center'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    flex: 1
  },
  time: {
    fontSize: 13,
    color: '#8E8E93',
    marginLeft: 8
  },
  lastMessageRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  messagePreview: {
    fontSize: 14,
    color: '#8E8E93',
    flex: 1
  },
  unreadText: {
    fontWeight: '600',
    color: '#000'
  },
  unreadBadge: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    marginLeft: 8
  },
  unreadBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600'
  },
  emptyText: {
    fontSize: 16,
    color: '#8E8E93'
  }
});

const formatTime = (timestamp) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInHours = (now - date) / (1000 * 60 * 60);

  if (diffInHours < 24) {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  } else if (diffInHours < 48) {
    return 'Yesterday';
  } else if (diffInHours < 168) {
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  } else {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  }
};

export default ConversationListScreen;
```

## Key Points

1. **Socket Connection**: Initialize once and maintain throughout the app lifecycle
2. **Event Listeners**: Listen to `conversation_updated` event
3. **State Updates**: Update local state when receiving updates
4. **Sorting**: Always re-sort conversations by `last_message_at`
5. **Unread Count**: Increment for messages from others, keep at 0 for your own messages
6. **Notifications**: Play sound/show alert for messages from others
7. **Cleanup**: Always remove event listeners and disconnect socket on unmount

## Testing

1. Open app on two devices with different users
2. Send a message from Device A
3. Verify that Device B's conversation list updates immediately:
   - Conversation moves to top
   - Last message preview updates
   - Unread count increments
   - Notification sound plays
4. Open the conversation on Device B
5. Verify unread count resets to 0

