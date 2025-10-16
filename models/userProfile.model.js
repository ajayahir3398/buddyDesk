module.exports = (sequelize, DataTypes) => {
  const UserProfile = sequelize.define("user_profile", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      references: {
        model: 'user',
        key: 'id'
      }
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true
    },
    dob: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    gender: {
      type: DataTypes.ENUM('Male', 'Female', 'Other'),
      allowNull: true
    },
    bio: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    image_path: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Relative path for user profile image'
    },
    looking_skills: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
      comment: 'Array of skill IDs that the user is looking for'
    },
    android_app_version: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: 'Current Android app version used by the user'
    },
    ios_app_version: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: 'Current iOS app version used by the user'
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
    tableName: 'user_profile',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  UserProfile.associate = (models) => {
    UserProfile.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
  };

  return UserProfile;
};