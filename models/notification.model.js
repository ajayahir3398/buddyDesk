module.exports = (sequelize, DataTypes) => {
  const Notification = sequelize.define("notifications", {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true
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
    message_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: {
        model: 'messages',
        key: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
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
    type: {
      type: DataTypes.ENUM('message', 'mention', 'group_invite', 'system'),
      allowNull: false,
      defaultValue: 'message'
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: 'Notification title'
    },
    body: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Notification body text'
    },
    data: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Additional notification data'
    },
    is_seen: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    is_read: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    seen_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    read_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    push_sent: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Whether push notification was sent'
    },
    push_sent_at: {
      type: DataTypes.DATE,
      allowNull: true
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
    tableName: 'notifications',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['user_id']
      },
      {
        fields: ['message_id']
      },
      {
        fields: ['conversation_id']
      },
      {
        fields: ['type']
      },
      {
        fields: ['is_seen']
      },
      {
        fields: ['is_read']
      },
      {
        fields: ['created_at']
      },
      {
        fields: ['user_id', 'is_seen']
      }
    ]
  });

  Notification.associate = (models) => {
    Notification.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
    Notification.belongsTo(models.Message, { foreignKey: 'message_id', as: 'message' });
    Notification.belongsTo(models.Conversation, { foreignKey: 'conversation_id', as: 'conversation' });
  };

  return Notification;
};