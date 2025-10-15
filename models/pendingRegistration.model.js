module.exports = (sequelize, DataTypes) => {
  const PendingRegistration = sequelize.define("pending_registration", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      comment: 'Email address for registration'
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'User full name'
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Hashed password'
    },
    referred_by: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Referral code of the user who invited this user'
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
      comment: 'Registration expiration timestamp (15 minutes)'
    },
    attempts: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Number of verification attempts'
    },
    resend_attempts: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Number of times OTP has been resent'
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
    tableName: 'pending_registration',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    indexes: [
      {
        fields: ['email']
      },
      {
        fields: ['expires_at']
      },
      {
        fields: ['is_verified']
      },
      {
        fields: ['resend_attempts']
      }
    ]
  });

  return PendingRegistration;
};
