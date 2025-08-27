module.exports = (sequelize, DataTypes) => {
  const PostAttachment = sequelize.define("post_attachments", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    post_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'posts',
        key: 'id'
      }
    },
    file_name: {
      type: DataTypes.STRING,
      allowNull: true
    },
    file_path: {
      type: DataTypes.STRING,
      allowNull: true
    },
    file_category: {
      type: DataTypes.ENUM('images', 'audio', 'documents', 'posts'),
      allowNull: true,
      defaultValue: 'posts'
    },
    mime_type: {
      type: DataTypes.STRING,
      allowNull: true
    },
    size: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    is_deleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    uploaded_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'post_attachments',
    timestamps: false
  });

  PostAttachment.associate = (models) => {
    PostAttachment.belongsTo(models.Post, { foreignKey: 'post_id', as: 'post' });
  };

  return PostAttachment;
}; 