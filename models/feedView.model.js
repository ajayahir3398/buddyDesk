module.exports = (sequelize, DataTypes) => {
  const FeedView = sequelize.define("feed_views", {
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
      allowNull: true,
      references: {
        model: 'user',
        key: 'id'
      },
      comment: 'NULL for anonymous views'
    },
    view_duration: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'View duration in seconds'
    },
    device_type: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'mobile, desktop, tablet, etc.'
    },
    ip_address: {
      type: DataTypes.STRING(45),
      allowNull: true,
      comment: 'IP address for anonymous tracking'
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'feed_views',
    timestamps: false,
    indexes: [
      {
        fields: ['feed_post_id', 'created_at']
      },
      {
        fields: ['user_id', 'created_at']
      },
      {
        fields: ['device_type']
      }
    ]
  });

  FeedView.associate = (models) => {
    FeedView.belongsTo(models.FeedPost, { foreignKey: 'feed_post_id', as: 'feedPost' });
    FeedView.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
  };

  return FeedView;
};
