module.exports = (sequelize, DataTypes) => {
  const FeedFollow = sequelize.define("feed_follows", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    follower_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'user',
        key: 'id'
      }
    },
    following_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'user',
        key: 'id'
      }
    },
    follow_type: {
      type: DataTypes.ENUM('follow', 'mute', 'block'),
      allowNull: false,
      defaultValue: 'follow',
      comment: 'follow: normal follow, mute: hide their posts, block: block user completely'
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'feed_follows',
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ['follower_id', 'following_id']
      },
      {
        fields: ['follower_id', 'follow_type']
      },
      {
        fields: ['following_id', 'follow_type']
      }
    ]
  });

  FeedFollow.associate = (models) => {
    FeedFollow.belongsTo(models.User, { foreignKey: 'follower_id', as: 'follower' });
    FeedFollow.belongsTo(models.User, { foreignKey: 'following_id', as: 'following' });
  };

  return FeedFollow;
};
