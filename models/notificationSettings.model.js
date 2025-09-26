module.exports = (sequelize, DataTypes) => {
  const NotificationSettings = sequelize.define("notification_settings", {
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
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
      comment: 'Foreign key reference to user table'
    },
    push_notification: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: 'Enable/disable push notifications'
    },
    general_notification: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: 'Enable/disable general notifications'
    },
    skill_exchange_notification: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: 'Enable/disable skill exchange notifications'
    },
    message_notification: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: 'Enable/disable message notifications'
    },
    marketing_notification: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Enable/disable marketing notifications'
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
    tableName: 'notification_settings',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  NotificationSettings.associate = (models) => {
    // Each notification setting belongs to a user
    NotificationSettings.belongsTo(models.User, { 
      foreignKey: 'user_id', 
      as: 'user',
      onDelete: 'CASCADE'
    });
  };

  return NotificationSettings;
};
