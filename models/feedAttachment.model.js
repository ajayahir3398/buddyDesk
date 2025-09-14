module.exports = (sequelize, DataTypes) => {
  const FeedAttachment = sequelize.define("feed_attachments", {
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
    file_path: {
      type: DataTypes.STRING(500),
      allowNull: false,
      comment: 'Relative path to the file from uploads directory'
    },
    file_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: 'Original filename'
    },
    file_type: {
      type: DataTypes.ENUM('image', 'video', 'document', 'audio'),
      allowNull: false
    },
    mime_type: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    file_size: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'File size in bytes'
    },
    thumbnail_path: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: 'Path to thumbnail for videos/images'
    },
    duration: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Duration in seconds for videos/audio'
    },
    width: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Width in pixels for images/videos'
    },
    height: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Height in pixels for images/videos'
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'feed_attachments',
    timestamps: false,
    indexes: [
      {
        fields: ['feed_post_id']
      },
      {
        fields: ['file_type']
      }
    ]
  });

  FeedAttachment.associate = (models) => {
    FeedAttachment.belongsTo(models.FeedPost, { foreignKey: 'feed_post_id', as: 'feedPost' });
  };

  return FeedAttachment;
};
