module.exports = (sequelize, DataTypes) => {
  const PostReport = sequelize.define("post_reports", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    post_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'posts',
        key: 'id'
      }
    },
    reported_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'user',
        key: 'id'
      },
      comment: 'User who reported the post'
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Reason for reporting the post'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Additional details about the report'
    },
    status: {
      type: DataTypes.ENUM('pending', 'reviewed', 'resolved', 'dismissed'),
      defaultValue: 'pending',
      comment: 'Status of the report review'
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
    tableName: 'post_reports',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['post_id', 'reported_by'],
        unique: true,
        comment: 'User can only report a post once'
      },
      {
        fields: ['reported_by']
      },
      {
        fields: ['status']
      }
    ]
  });

  PostReport.associate = (models) => {
    PostReport.belongsTo(models.Post, { foreignKey: 'post_id', as: 'post' });
    PostReport.belongsTo(models.User, { foreignKey: 'reported_by', as: 'reporter' });
  };

  return PostReport;
};

