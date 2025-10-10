module.exports = (sequelize, DataTypes) => {
  const PostSwipe = sequelize.define("postSwipe", {
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
    post_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'posts',
        key: 'id'
      }
    },
    swipe_type: {
      type: DataTypes.ENUM('left', 'right'),
      allowNull: false,
      comment: 'left = hide for 120 days, right = hide permanently'
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Null for permanent (right swipe), or created_at + 120 days for left swipe'
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'post_swipe',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        unique: true,
        fields: ['user_id', 'post_id'],
        name: 'unique_user_post_swipe'
      },
      {
        fields: ['user_id', 'swipe_type']
      },
      {
        fields: ['expires_at']
      }
    ]
  });

  PostSwipe.associate = (models) => {
    PostSwipe.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
    PostSwipe.belongsTo(models.Post, { foreignKey: 'post_id', as: 'post' });
  };

  return PostSwipe;
};

