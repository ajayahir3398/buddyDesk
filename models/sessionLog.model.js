module.exports = (sequelize, DataTypes) => {
  const SessionLog = sequelize.define("session_logs", {
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
    refresh_token: {
      type: DataTypes.STRING,
      allowNull: true
    },
    user_agent: {
      type: DataTypes.STRING,
      allowNull: true
    },
    ip_address: {
      type: DataTypes.STRING,
      allowNull: true
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    last_used_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    revoked_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    reason: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    tableName: 'session_logs',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
  });

  SessionLog.associate = (models) => {
    SessionLog.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
  };

  return SessionLog;
}; 