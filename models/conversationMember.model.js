module.exports = (sequelize, DataTypes) => {
  const ConversationMember = sequelize.define("conversation_members", {
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
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'user',
        key: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    },
    role: {
      type: DataTypes.ENUM('admin', 'member'),
      allowNull: false,
      defaultValue: 'member',
      comment: 'Role of the user in the conversation'
    },
    is_muted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Whether the user has muted this conversation'
    },
    is_pinned: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Whether the user has pinned this conversation'
    },
    last_read_message_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
      comment: 'ID of the last message read by this user'
    },
    joined_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    left_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When the user left the conversation (null if still active)'
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
    tableName: 'conversation_members',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['conversation_id', 'user_id'],
        unique: true
      },
      {
        fields: ['user_id']
      },
      {
        fields: ['conversation_id']
      },
      {
        fields: ['role']
      },
      {
        fields: ['left_at']
      }
    ]
  });

  ConversationMember.associate = (models) => {
    ConversationMember.belongsTo(models.Conversation, { foreignKey: 'conversation_id', as: 'conversation' });
    ConversationMember.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
  };

  return ConversationMember;
};