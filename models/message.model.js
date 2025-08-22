module.exports = (sequelize, DataTypes) => {
  const Message = sequelize.define("messages", {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true
    },
    conversation_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: 'conversations',
        key: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    },
    sender_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'user',
        key: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
      comment: 'Null if user is deleted'
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Encrypted message content'
    },
    content_plain: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Plain text content for search indexing (optional)'
    },
    message_type: {
      type: DataTypes.ENUM('text', 'image', 'video', 'audio', 'file', 'system'),
      allowNull: false,
      defaultValue: 'text'
    },
    attachment_url: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'URL to attached file'
    },
    attachment_name: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Original filename of attachment'
    },
    attachment_size: {
      type: DataTypes.BIGINT,
      allowNull: true,
      comment: 'Size of attachment in bytes'
    },
    attachment_mime_type: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'MIME type of attachment'
    },
    reply_to_message_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: {
        model: 'messages',
        key: 'id'
      },
      onDelete: 'SET NULL',
      comment: 'ID of message being replied to'
    },
    forward_from_message_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: {
        model: 'messages',
        key: 'id'
      },
      onDelete: 'SET NULL',
      comment: 'ID of original message if forwarded'
    },
    is_edited: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    is_deleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Additional metadata for the message'
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'messages',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['conversation_id', 'created_at'],
        name: 'idx_messages_conversation_created_at'
      },
      {
        fields: ['sender_id']
      },
      {
        fields: ['message_type']
      },
      {
        fields: ['reply_to_message_id']
      },
      {
        fields: ['is_deleted']
      },
      {
        fields: ['created_at']
      }
    ]
  });

  Message.associate = (models) => {
    Message.belongsTo(models.Conversation, { foreignKey: 'conversation_id', as: 'conversation' });
    Message.belongsTo(models.User, { foreignKey: 'sender_id', as: 'sender' });
    Message.belongsTo(models.Message, { foreignKey: 'reply_to_message_id', as: 'replyToMessage' });
    Message.belongsTo(models.Message, { foreignKey: 'forward_from_message_id', as: 'forwardFromMessage' });
    Message.hasMany(models.MessageStatus, { foreignKey: 'message_id', as: 'statuses' });
    Message.hasMany(models.Message, { foreignKey: 'reply_to_message_id', as: 'replies' });
  };

  return Message;
};