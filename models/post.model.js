module.exports = (sequelize, DataTypes) => {
  const Post = sequelize.define("posts", {
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
    title: {
      type: DataTypes.STRING,
      allowNull: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    required_skill_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'skills',
        key: 'id'
      }
    },
    required_sub_skill_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'sub_skills',
        key: 'id'
      }
    },
    medium: {
      type: DataTypes.ENUM('online', 'offline', 'hybrid'),
      defaultValue: 'online'
    },
    status: {
      type: DataTypes.ENUM('active', 'hold', 'discussed', 'completed', 'deleted'),
      defaultValue: 'active'
    },
    deadline: {
      type: DataTypes.DATEONLY,
      allowNull: true
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
    tableName: 'posts',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  Post.associate = (models) => {
    Post.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
    Post.belongsTo(models.Skill, { foreignKey: 'required_skill_id', as: 'requiredSkill' });
    Post.belongsTo(models.SubSkill, { foreignKey: 'required_sub_skill_id', as: 'requiredSubSkill' });
    Post.hasMany(models.PostAttachment, { foreignKey: 'post_id', as: 'attachments' });
  };

  return Post;
}; 