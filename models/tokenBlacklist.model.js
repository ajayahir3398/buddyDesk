module.exports = (sequelize, DataTypes) => {
  const TokenBlacklist = sequelize.define("token_blacklist", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    token: {
      type: DataTypes.TEXT,
      allowNull: true,
      unique: true
    },
    expired_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    blacklisted_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    reason: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    tableName: 'token_blacklist',
    timestamps: false
  });

  return TokenBlacklist;
}; 