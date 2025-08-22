module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define("user", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    is_online: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Whether the user is currently online'
    },
    last_seen: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Last time the user was active'
    },
    socket_id: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Current socket connection ID'
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
    tableName: 'user',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  User.associate = (models) => {
    User.hasOne(models.UserProfile, { foreignKey: 'user_id', as: 'profile' });
    User.hasMany(models.WorkProfile, { foreignKey: 'user_id', as: 'workProfiles' });
    User.hasMany(models.Address, { foreignKey: 'user_id', as: 'addresses' });
    User.hasMany(models.TempAddress, { foreignKey: 'user_id', as: 'tempAddresses' });
    User.hasMany(models.SessionLog, { foreignKey: 'user_id', as: 'sessionLogs' });
    User.hasMany(models.Post, { foreignKey: 'user_id', as: 'posts' });
    User.hasMany(models.UserSkillReview, { foreignKey: 'reviewer_user_id', as: 'reviews' });
    User.hasMany(models.AadhaarVerification, { foreignKey: 'user_id', as: 'aadhaarVerifications' });
    
    // Chat-related associations
    User.hasMany(models.Conversation, { foreignKey: 'created_by', as: 'createdConversations' });
    User.hasMany(models.ConversationMember, { foreignKey: 'user_id', as: 'conversationMemberships' });
    User.hasMany(models.Message, { foreignKey: 'sender_id', as: 'sentMessages' });
    User.hasMany(models.MessageStatus, { foreignKey: 'user_id', as: 'messageStatuses' });
    User.hasMany(models.TypingStatus, { foreignKey: 'user_id', as: 'typingStatuses' });
    User.hasMany(models.Notification, { foreignKey: 'user_id', as: 'notifications' });
  };

  return User;
};