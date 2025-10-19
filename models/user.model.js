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
    referral_code: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: true
    },
    referred_by: {
      type: DataTypes.STRING,
      allowNull: true
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
    is_blocked: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Whether the user is blocked due to excessive reporting'
    },
    report_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Total number of reports made by this user'
    },
    is_verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Whether the user is verified (e.g., email verified, identity verified)'
    },
    subscription_tier: {
      type: DataTypes.ENUM('free', 'basic', 'premium', 'enterprise'),
      defaultValue: 'free',
      comment: 'Current subscription tier of the user'
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Soft delete timestamp'
    }
  }, {
    tableName: 'user',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    paranoid: true,
    deletedAt: 'deleted_at'
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
    User.hasOne(models.NotificationSettings, { foreignKey: 'user_id', as: 'notificationSettings' });
    
    // Feed-related associations
    User.hasMany(models.FeedPost, { foreignKey: 'user_id', as: 'feedPosts' });
    User.hasMany(models.FeedLike, { foreignKey: 'user_id', as: 'feedLikes' });
    User.hasMany(models.FeedComment, { foreignKey: 'user_id', as: 'feedComments' });
    User.hasMany(models.FeedShare, { foreignKey: 'user_id', as: 'feedShares' });
    User.hasMany(models.FeedView, { foreignKey: 'user_id', as: 'feedViews' });
    User.hasMany(models.FeedFollow, { foreignKey: 'follower_id', as: 'following' });
    User.hasMany(models.FeedFollow, { foreignKey: 'following_id', as: 'followers' });
    
    // Report-related associations
    User.hasMany(models.PostReport, { foreignKey: 'reported_by', as: 'postReports' });
    User.hasMany(models.FeedPostReport, { foreignKey: 'reported_by', as: 'feedPostReports' });
    
    // Block-related associations
    User.hasMany(models.UserBlock, { foreignKey: 'blocker_id', as: 'blockedUsers' });
    User.hasMany(models.UserBlock, { foreignKey: 'blocked_id', as: 'blockedBy' });
    
    // Subscription-related associations
    User.hasMany(models.Subscription, { foreignKey: 'user_id', as: 'subscriptions' });
    User.hasMany(models.SubscriptionPurchaseData, { foreignKey: 'user_id', as: 'subscriptionPurchaseData' });
  };

  return User;
};