module.exports = (sequelize, DataTypes) => {
  const PasswordResetOTP = sequelize.define("password_reset_otp", {
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
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Email address where OTP was sent'
    },
    otp: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Hashed OTP code'
    },
    is_verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Whether the OTP has been verified'
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: 'OTP expiration timestamp'
    },
    attempts: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Number of verification attempts'
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    verified_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Timestamp when OTP was verified'
    }
  }, {
    tableName: 'password_reset_otp',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    indexes: [
      {
        fields: ['user_id']
      },
      {
        fields: ['email']
      },
      {
        fields: ['expires_at']
      }
    ]
  });

  PasswordResetOTP.associate = (models) => {
    PasswordResetOTP.belongsTo(models.User, { 
      foreignKey: 'user_id', 
      as: 'user' 
    });
  };

  return PasswordResetOTP;
};

