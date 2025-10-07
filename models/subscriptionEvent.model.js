module.exports = (sequelize, DataTypes) => {
  const SubscriptionEvent = sequelize.define("subscription_events", {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true
    },
    subscription_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'subscriptions',
        key: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    },
    event_type: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: 'Type of event (e.g., RENEWAL, CANCELLATION, REFUND, etc.)'
    },
    platform: {
      type: DataTypes.ENUM('play', 'appstore'),
      allowNull: false
    },
    notification_id: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Unique notification ID from store (for deduplication)'
    },
    event_timestamp: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Timestamp from the store event'
    },
    processed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Whether this event has been processed'
    },
    processed_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    raw_payload: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Raw webhook payload for audit'
    },
    error_message: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Error message if processing failed'
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'subscription_events',
    timestamps: false,
    indexes: [
      {
        fields: ['subscription_id', 'created_at']
      },
      {
        fields: ['platform', 'notification_id'],
        unique: true,
        where: {
          notification_id: {
            [sequelize.Sequelize.Op.ne]: null
          }
        }
      },
      {
        fields: ['processed', 'created_at']
      },
      {
        fields: ['event_type']
      }
    ]
  });

  SubscriptionEvent.associate = (models) => {
    SubscriptionEvent.belongsTo(models.Subscription, { 
      foreignKey: 'subscription_id', 
      as: 'subscription' 
    });
  };

  return SubscriptionEvent;
};

