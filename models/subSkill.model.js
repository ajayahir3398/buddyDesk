module.exports = (sequelize, DataTypes) => {
  const SubSkill = sequelize.define("sub_skills", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    skill_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'skills',
        key: 'id'
      }
    },
    name: {
      type: DataTypes.STRING,
      allowNull: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'sub_skills',
    timestamps: false
  });

  SubSkill.associate = (models) => {
    SubSkill.belongsTo(models.Skill, { foreignKey: 'skill_id', as: 'skill' });
    SubSkill.hasMany(models.UserSkill, { foreignKey: 'sub_skill_id', as: 'userSkills' });
    SubSkill.hasMany(models.Post, { foreignKey: 'required_sub_skill_id', as: 'posts' });
  };

  return SubSkill;
}; 