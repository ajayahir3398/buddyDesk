module.exports = (sequelize, DataTypes) => {
  const Skill = sequelize.define("skills", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
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
    tableName: 'skills',
    timestamps: false
  });

  Skill.associate = (models) => {
    Skill.hasMany(models.SubSkill, { foreignKey: 'skill_id', as: 'subSkills' });
    Skill.hasMany(models.UserSkill, { foreignKey: 'skill_id', as: 'userSkills' });
    Skill.hasMany(models.Post, { foreignKey: 'required_skill_id', as: 'posts' });
  };

  return Skill;
}; 