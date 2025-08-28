module.exports = (sequelize, DataTypes) => {
	const DeviceToken = sequelize.define('device_tokens', {
		id: {
			type: DataTypes.BIGINT,
			primaryKey: true,
			autoIncrement: true
		},
		user_id: {
			type: DataTypes.INTEGER,
			allowNull: false,
			references: { model: 'user', key: 'id' },
			onDelete: 'CASCADE',
			onUpdate: 'CASCADE'
		},
		fcm_token: {
			type: DataTypes.TEXT,
			allowNull: false,
			unique: true
		},
		platform: {
			type: DataTypes.ENUM('ios', 'android', 'web', 'unknown'),
			defaultValue: 'unknown'
		},
		device_info: {
			type: DataTypes.JSONB,
			allowNull: true
		},
		last_used_at: {
			type: DataTypes.DATE,
			allowNull: true
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
		tableName: 'device_tokens',
		timestamps: true,
		createdAt: 'created_at',
		updatedAt: 'updated_at',
		indexes: [
			{ fields: ['user_id'] },
			{ fields: ['fcm_token'] }
		]
	});

	DeviceToken.associate = (models) => {
		DeviceToken.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
	};

	return DeviceToken;
};


