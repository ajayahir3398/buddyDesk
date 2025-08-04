module.exports = (sequelize, DataTypes) => {
  const Project = sequelize.define("projects", {
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
    name: {
      type: DataTypes.STRING,
      allowNull: true
    },
    description: {
      type: DataTypes.TEXT,
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
    tech_stack: {
      type: DataTypes.ARRAY(DataTypes.STRING),
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
    tableName: 'projects',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  Project.associate = (models) => {
    Project.belongsTo(models.WorkProfile, { foreignKey: 'work_profile_id', as: 'workProfile' });
  };

  return Project;
}; 