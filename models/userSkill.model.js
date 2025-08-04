module.exports = (sequelize, DataTypes) => {
  const UserSkill = sequelize.define("user_skills", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    work_profile_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'work_profile',
        key: 'id'
      }
    },
    skill_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'skills',
        key: 'id'
      }
    },
    sub_skill_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'sub_skills',
        key: 'id'
      }
    },
    proficiency_level: {
      type: DataTypes.ENUM('Beginner', 'Intermediate', 'Expert'),
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
    tableName: 'user_skills',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        unique: true,
        fields: ['work_profile_id', 'skill_id', 'sub_skill_id']
      }
    ]
  });

  UserSkill.associate = (models) => {
    UserSkill.belongsTo(models.WorkProfile, { foreignKey: 'work_profile_id', as: 'workProfile' });
    UserSkill.belongsTo(models.Skill, { foreignKey: 'skill_id', as: 'skill' });
    UserSkill.belongsTo(models.SubSkill, { foreignKey: 'sub_skill_id', as: 'subSkill' });
    UserSkill.hasMany(models.UserSkillReview, { foreignKey: 'user_skill_id', as: 'reviews' });
  };

  return UserSkill;
}; 