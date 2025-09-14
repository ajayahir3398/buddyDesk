module.exports = (sequelize, DataTypes) => {
  const FeedComment = sequelize.define("feed_comments", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    feed_post_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'feed_posts',
        key: 'id'
      }
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'user',
        key: 'id'
      }
    },
    parent_comment_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'feed_comments',
        key: 'id'
      },
      comment: 'For nested replies to comments'
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        len: [1, 1000] // Max 1000 characters per comment
      }
    },
    is_edited: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Whether this comment has been edited'
    },
    like_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Number of likes on this comment'
    },
    reply_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Number of replies to this comment'
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
    tableName: 'feed_comments',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['feed_post_id', 'created_at']
      },
      {
        fields: ['user_id', 'created_at']
      },
      {
        fields: ['parent_comment_id']
      },
      {
        fields: ['status', 'created_at']
      }
    ]
  });

  FeedComment.associate = (models) => {
    FeedComment.belongsTo(models.FeedPost, { foreignKey: 'feed_post_id', as: 'feedPost' });
    FeedComment.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
    FeedComment.belongsTo(models.FeedComment, { foreignKey: 'parent_comment_id', as: 'parentComment' });
    FeedComment.hasMany(models.FeedComment, { foreignKey: 'parent_comment_id', as: 'replies' });
  };

  return FeedComment;
};
