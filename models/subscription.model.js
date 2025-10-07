module.exports = (sequelize, DataTypes) => {
  const Subscription = sequelize.define("subscriptions", {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
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
    product_id: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: 'Product SKU / subscription ID from store'
    },
    status: {
      type: DataTypes.ENUM(
        'active',
        'canceled',
        'expired',
        'grace_period',
        'on_hold',
        'paused',
        'pending',
        'in_retry',
        'revoked'
      ),
      allowNull: false,
      defaultValue: 'pending',
      comment: 'Current subscription status'
    },
    is_auto_renewing: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: 'Whether subscription will auto-renew'
    },
    is_trial: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Whether this is a trial subscription'
    },
    purchase_token: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Google Play purchase token or Apple transaction ID'
    },
    original_transaction_id: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Apple original transaction ID (persists across renewals)'
    },
    order_id: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Store order ID (GPA.xxxx for Google, order ID for Apple)'
    },
    purchase_date: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Date when subscription was purchased'
    },
    expiry_date: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Date when subscription expires'
    },
    price_amount_micros: {
      type: DataTypes.BIGINT,
      allowNull: true,
      comment: 'Price in micros (1,000,000 = 1 unit of currency)'
    },
    currency: {
      type: DataTypes.STRING(10),
      allowNull: true,
      comment: 'Currency code (USD, EUR, etc.)'
    },
    acknowledged: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Whether Google Play purchase has been acknowledged'
    },
    cancel_reason: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Reason for cancellation if applicable'
    },
    cancel_date: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Date when subscription was cancelled'
    },
    app_account_token: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Apple app account token or Google obfuscated account ID for linking'
    },
    environment: {
      type: DataTypes.ENUM('production', 'sandbox'),
      defaultValue: 'production',
      comment: 'Store environment (production or sandbox/test)'
    },
    last_notification_type: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Last webhook notification type received'
    },
    last_notification_date: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Date of last webhook notification'
    },
    raw_data: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Raw store response for debugging and audit'
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
    tableName: 'subscriptions',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['user_id']
      },
      {
        fields: ['platform', 'purchase_token'],
        unique: true,
        where: {
          purchase_token: {
            [sequelize.Sequelize.Op.ne]: null
          }
        }
      },
      {
        fields: ['status']
      },
      {
        fields: ['expiry_date']
      },
      {
        fields: ['platform', 'original_transaction_id']
      },
      {
        fields: ['user_id', 'status', 'expiry_date']
      }
    ]
  });

  Subscription.associate = (models) => {
    Subscription.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
  };

  return Subscription;
};

