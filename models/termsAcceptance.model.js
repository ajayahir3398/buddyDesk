module.exports = (sequelize, DataTypes) => {
  const TermsAcceptance = sequelize.define("terms_acceptance", {
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
      },
      comment: 'User who accepted the terms'
    },
    version: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: 'Version of terms and conditions accepted (e.g., "1.0", "2.0")'
    },
    ip_address: {
      type: DataTypes.STRING(45),
      allowNull: true,
      comment: 'IP address from which acceptance was made (supports IPv4 and IPv6)'
    },
    user_agent: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Browser/device user agent string'
    },
    device_info: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Additional device information (platform, device type, etc.)'
    },
    accepted_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: 'Timestamp when terms were accepted'
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
    tableName: 'terms_acceptance',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        name: 'idx_user_version',
        fields: ['user_id', 'version']
      },
      {
        name: 'idx_accepted_at',
        fields: ['accepted_at']
      },
      {
        name: 'idx_user_accepted',
        fields: ['user_id', 'accepted_at']
      }
    ]
  });

  TermsAcceptance.associate = (models) => {
    TermsAcceptance.belongsTo(models.User, { 
      foreignKey: 'user_id', 
      as: 'user' 
    });
  };

  return TermsAcceptance;
};

