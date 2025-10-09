module.exports = (sequelize, DataTypes) => {
  const UserBlock = sequelize.define("user_blocks", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    blocker_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'user',
        key: 'id'
      },
      comment: 'User who is blocking'
    },
    blocked_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'user',
        key: 'id'
      },
      comment: 'User who is being blocked'
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Optional reason for blocking'
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
    tableName: 'user_blocks',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['blocker_id', 'blocked_id'],
        unique: true,
        comment: 'User can only block another user once'
      },
      {
        fields: ['blocker_id']
      },
      {
        fields: ['blocked_id']
      }
    ]
  });

  UserBlock.associate = (models) => {
    UserBlock.belongsTo(models.User, { foreignKey: 'blocker_id', as: 'blocker' });
    UserBlock.belongsTo(models.User, { foreignKey: 'blocked_id', as: 'blocked' });
  };

  return UserBlock;
};

