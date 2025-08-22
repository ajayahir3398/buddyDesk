module.exports = (sequelize, DataTypes) => {
  const Conversation = sequelize.define("conversations", {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true
    },
    type: {
      type: DataTypes.ENUM('private', 'group'),
      allowNull: false,
      defaultValue: 'private'
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Group name for group chats, null for private chats'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Group description for group chats'
    },
    avatar_url: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Group avatar URL for group chats'
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'user',
        key: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: 'Whether the conversation is active'
    },
    last_message_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Timestamp of the last message in this conversation'
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
    tableName: 'conversations',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['type']
      },
      {
        fields: ['created_by']
      },
      {
        fields: ['is_active']
      },
      {
        fields: ['last_message_at']
      }
    ]
  });

  Conversation.associate = (models) => {
    Conversation.belongsTo(models.User, { foreignKey: 'created_by', as: 'creator' });
    Conversation.hasMany(models.ConversationMember, { foreignKey: 'conversation_id', as: 'members' });
    Conversation.hasMany(models.Message, { foreignKey: 'conversation_id', as: 'messages' });
    Conversation.hasMany(models.TypingStatus, { foreignKey: 'conversation_id', as: 'typingStatuses' });
  };

  return Conversation;
};