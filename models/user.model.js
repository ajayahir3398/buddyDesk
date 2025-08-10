module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define("user", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
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
    tableName: 'user',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  User.associate = (models) => {
    User.hasOne(models.UserProfile, { foreignKey: 'user_id', as: 'profile' });
    User.hasMany(models.WorkProfile, { foreignKey: 'user_id', as: 'workProfiles' });
    User.hasMany(models.Address, { foreignKey: 'user_id', as: 'addresses' });
    User.hasMany(models.SessionLog, { foreignKey: 'user_id', as: 'sessionLogs' });
    User.hasMany(models.Post, { foreignKey: 'user_id', as: 'posts' });
    User.hasMany(models.UserSkillReview, { foreignKey: 'reviewer_user_id', as: 'reviews' });
    User.hasMany(models.AadhaarVerification, { foreignKey: 'user_id', as: 'aadhaarVerifications' });
  };

  return User;
}; 