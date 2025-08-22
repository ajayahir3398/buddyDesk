module.exports = (sequelize, DataTypes) => {
  const TypingStatus = sequelize.define("typing_status", {
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
    is_typing: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    started_typing_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When the user started typing'
    },
    last_typing_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Last time typing activity was detected'
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
    tableName: 'typing_status',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['conversation_id', 'user_id'],
        unique: true
      },
      {
        fields: ['conversation_id']
      },
      {
        fields: ['user_id']
      },
      {
        fields: ['is_typing']
      },
      {
        fields: ['last_typing_at']
      }
    ]
  });

  TypingStatus.associate = (models) => {
    TypingStatus.belongsTo(models.Conversation, { foreignKey: 'conversation_id', as: 'conversation' });
    TypingStatus.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
  };

  return TypingStatus;
};