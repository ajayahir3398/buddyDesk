module.exports = (sequelize, DataTypes) => {
  const TempAddress = sequelize.define("tempAddress", {
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
    location_data: {
      type: DataTypes.STRING,
      allowNull: false
    },
    pincode: {
      type: DataTypes.STRING(6),
      allowNull: false,
      validate: {
        len: [6, 6]
      }
    },
    selected_area: {
      type: DataTypes.STRING,
      allowNull: false
    },
    location_permission: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    // Additional useful fields for temporary addresses
    city: {
      type: DataTypes.STRING,
      allowNull: true
    },
    state: {
      type: DataTypes.STRING,
      allowNull: true
    },
    country: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: 'India'
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    expires_at: {
      type: DataTypes.DATE,
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
    tableName: 'temp_address',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  TempAddress.associate = (models) => {
    TempAddress.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
  };

  return TempAddress;
};
