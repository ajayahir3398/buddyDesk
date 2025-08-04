module.exports = (sequelize, DataTypes) => {
  const WorkProfile = sequelize.define("work_profile", {
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
    company_name: {
      type: DataTypes.STRING,
      allowNull: true
    },
    designation: {
      type: DataTypes.STRING,
      allowNull: true
    },
    start_date: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    end_date: {
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
    tableName: 'work_profile',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  WorkProfile.associate = (models) => {
    WorkProfile.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
    WorkProfile.hasMany(models.Project, { foreignKey: 'work_profile_id', as: 'projects' });
    WorkProfile.hasMany(models.UserSkill, { foreignKey: 'work_profile_id', as: 'userSkills' });
  };

  return WorkProfile;
}; 