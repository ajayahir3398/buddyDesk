module.exports = (sequelize, DataTypes) => {
  const SubscriptionPurchaseData = sequelize.define("subscription_purchase_data", {
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
    platform: {
      type: DataTypes.ENUM('play', 'appstore'),
      allowNull: false,
      comment: 'Purchase platform - Google Play or Apple App Store'
    },
    purchase_data: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'Raw subscription purchase data as string'
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
    tableName: 'subscription_purchase_data',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['user_id']
      },
      {
        fields: ['platform']
      },
      {
        fields: ['created_at']
      }
    ]
  });

  SubscriptionPurchaseData.associate = (models) => {
    SubscriptionPurchaseData.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });
  };

  return SubscriptionPurchaseData;
};
