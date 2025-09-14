module.exports = (sequelize, DataTypes) => {
  const FeedLike = sequelize.define("feed_likes", {
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
    like_type: {
      type: DataTypes.ENUM('like', 'love', 'laugh', 'wow', 'sad', 'angry'),
      allowNull: false,
      defaultValue: 'like'
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'feed_likes',
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ['feed_post_id', 'user_id']
      },
      {
        fields: ['user_id', 'created_at']
      },
      {
        fields: ['like_type']
      }
    ]
  });

  FeedLike.associate = (models) => {
    FeedLike.belongsTo(models.FeedPost, { foreignKey: 'feed_post_id', as: 'feedPost' });
    FeedLike.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
  };

  return FeedLike;
};
