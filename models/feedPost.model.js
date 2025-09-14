module.exports = (sequelize, DataTypes) => {
  const FeedPost = sequelize.define("feed_posts", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'user',
        key: 'id'
      }
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        len: [1, 5000] // Max 5000 characters
      }
    },
    is_pinned: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Whether this post is pinned by the user'
    },
    is_featured: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Whether this post is featured by admin'
    },
    engagement_score: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
      comment: 'Calculated engagement score for ranking'
    },
    view_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Total number of views'
    },
    like_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Total number of likes'
    },
    comment_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Total number of comments'
    },
    share_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Total number of shares'
    },
    status: {
      type: DataTypes.ENUM('active', 'hidden', 'deleted'),
      defaultValue: 'active'
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
    tableName: 'feed_posts',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['user_id', 'created_at']
      },
      {
        fields: ['post_type', 'status', 'created_at']
      },
      {
        fields: ['engagement_score', 'created_at']
      },
      {
        fields: ['visibility', 'status', 'created_at']
      }
    ]
  });

  FeedPost.associate = (models) => {
    FeedPost.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
    FeedPost.hasMany(models.FeedAttachment, { foreignKey: 'feed_post_id', as: 'attachments' });
    FeedPost.hasMany(models.FeedLike, { foreignKey: 'feed_post_id', as: 'likes' });
    FeedPost.hasMany(models.FeedComment, { foreignKey: 'feed_post_id', as: 'comments' });
    FeedPost.hasMany(models.FeedShare, { foreignKey: 'feed_post_id', as: 'shares' });
    FeedPost.hasMany(models.FeedView, { foreignKey: 'feed_post_id', as: 'views' });
  };

  return FeedPost;
};
