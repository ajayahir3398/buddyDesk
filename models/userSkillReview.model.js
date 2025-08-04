module.exports = (sequelize, DataTypes) => {
  const UserSkillReview = sequelize.define("user_skill_reviews", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    user_skill_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'user_skills',
        key: 'id'
      }
    },
    reviewer_user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'user',
        key: 'id'
      }
    },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
        max: 5
      }
    },
    comment: {
      type: DataTypes.STRING,
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
    tableName: 'user_skill_reviews',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        unique: true,
        fields: ['user_skill_id', 'reviewer_user_id']
      }
    ]
  });

  UserSkillReview.associate = (models) => {
    UserSkillReview.belongsTo(models.UserSkill, { foreignKey: 'user_skill_id', as: 'userSkill' });
    UserSkillReview.belongsTo(models.User, { foreignKey: 'reviewer_user_id', as: 'reviewer' });
  };

  return UserSkillReview;
}; 