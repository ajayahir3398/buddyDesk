module.exports = (sequelize, DataTypes) => {
  const FeedPostReport = sequelize.define("feed_post_reports", {
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
    reported_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'user',
        key: 'id'
      },
      comment: 'User who reported the feed post'
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Reason for reporting the feed post'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Additional details about the report'
    },
    status: {
      type: DataTypes.ENUM('pending', 'reviewed', 'resolved', 'dismissed'),
      defaultValue: 'pending',
      comment: 'Status of the report review'
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
    tableName: 'feed_post_reports',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['feed_post_id', 'reported_by'],
        unique: true,
        comment: 'User can only report a feed post once'
      },
      {
        fields: ['reported_by']
      },
      {
        fields: ['status']
      }
    ]
  });

  FeedPostReport.associate = (models) => {
    FeedPostReport.belongsTo(models.FeedPost, { foreignKey: 'feed_post_id', as: 'feedPost' });
    FeedPostReport.belongsTo(models.User, { foreignKey: 'reported_by', as: 'reporter' });
  };

  return FeedPostReport;
};

