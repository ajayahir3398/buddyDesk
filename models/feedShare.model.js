module.exports = (sequelize, DataTypes) => {
  const FeedShare = sequelize.define("feed_shares", {
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
    share_type: {
      type: DataTypes.ENUM('repost', 'quote', 'bookmark'),
      allowNull: false,
      comment: 'Type of share: repost (simple share), quote (share with comment), bookmark (save for later)'
    },
    quote_text: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Additional text for quote shares',
      validate: {
        len: [0, 1000] // Max 1000 characters for quote
      }
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'feed_shares',
    timestamps: false,
    indexes: [
      {
        fields: ['feed_post_id', 'created_at']
      },
      {
        fields: ['user_id', 'created_at']
      },
      {
        fields: ['share_type']
      }
    ]
  });

  FeedShare.associate = (models) => {
    FeedShare.belongsTo(models.FeedPost, { foreignKey: 'feed_post_id', as: 'feedPost' });
    FeedShare.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
  };

  return FeedShare;
};
