module.exports = (sequelize, DataTypes) => {
    const AadhaarVerification = sequelize.define("AadhaarVerification", {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'user',
                key: 'id'
            }
        },
        verification_id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            unique: true,
            allowNull: false
        },
        verification_type: {
            type: DataTypes.ENUM('XML', 'QR', 'NUMBER'),
            allowNull: false
        },
        verification_status: {
            type: DataTypes.ENUM('SUCCESS', 'FAILED', 'PENDING'),
            allowNull: false,
            defaultValue: 'PENDING'
        },
        aadhaar_number: {
            type: DataTypes.STRING(12),
            allowNull: true,
            validate: {
                isNumeric: true,
                len: [12, 12]
            }
        },
        masked_aadhaar_number: {
            type: DataTypes.STRING(12),
            allowNull: true
        },
        verification_data: {
            type: DataTypes.JSONB,
            allowNull: true,
            comment: 'Stores extracted demographic data'
        },
        signature_valid: {
            type: DataTypes.BOOLEAN,
            allowNull: true
        },
        timestamp_valid: {
            type: DataTypes.BOOLEAN,
            allowNull: true
        },
        checksum_valid: {
            type: DataTypes.BOOLEAN,
            allowNull: true
        },
        error_message: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        ip_address: {
            type: DataTypes.INET,
            allowNull: true
        },
        user_agent: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        verification_time: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        },
        expires_at: {
            type: DataTypes.DATE,
            allowNull: true
        }
    }, {
        tableName: 'aadhaar_verifications',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        deletedAt: 'deleted_at',
        paranoid: true, // Soft delete
        indexes: [
            {
                fields: ['user_id']
            },
            {
                fields: ['verification_id']
            },
            {
                fields: ['verification_type']
            },
            {
                fields: ['verification_status']
            },
            {
                fields: ['verification_time']
            },
            {
                fields: ['masked_aadhaar_number']
            }
        ]
    });

    AadhaarVerification.associate = function(models) {
        AadhaarVerification.belongsTo(models.User, {
            foreignKey: 'user_id',
            as: 'user'
        });
    };

    return AadhaarVerification;
};