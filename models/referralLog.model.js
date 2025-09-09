module.exports = (sequelize, DataTypes) => {
  const ReferralLog = sequelize.define("referral_log", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    referrer_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'user',
        key: 'id'
      }
    },
    referee_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'user',
        key: 'id'
      }
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'referral_logs',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false // No updated_at for referral logs
  });

  ReferralLog.associate = (models) => {
    ReferralLog.belongsTo(models.User, { foreignKey: 'referrer_id', as: 'referrer' });
    ReferralLog.belongsTo(models.User, { foreignKey: 'referee_id', as: 'referee' });
  };

  return ReferralLog;
};