module.exports = (sequelize, DataTypes) => {
  const MessageStatus = sequelize.define("message_status", {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true
    },
    message_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: 'messages',
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
    status: {
      type: DataTypes.ENUM('sent', 'delivered', 'read'),
      allowNull: false,
      defaultValue: 'sent'
    },
    delivered_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When the message was delivered to the user'
    },
    read_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When the message was read by the user'
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
    tableName: 'message_status',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['message_id', 'user_id'],
        unique: true
      },
      {
        fields: ['user_id']
      },
      {
        fields: ['status']
      },
      {
        fields: ['message_id']
      }
    ]
  });

  MessageStatus.associate = (models) => {
    MessageStatus.belongsTo(models.Message, { foreignKey: 'message_id', as: 'message' });
    MessageStatus.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
  };

  return MessageStatus;
};