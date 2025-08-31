module.exports = (sequelize, DataTypes) => {
    const AadhaarVerificationLog = sequelize.define("AadhaarVerificationLog", {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        verification_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'aadhaar_verifications',
                key: 'id'
            }
        },
        action: {
            type: DataTypes.ENUM(
                'VERIFICATION_INITIATED',
                'ZIP_EXTRACTED',
                'XML_PARSED',
                'DATA_DECRYPTED',
                'SIGNATURE_VERIFIED',
                'TIMESTAMP_VALIDATED',
                'QR_DECODED',
                'CHECKSUM_VERIFIED',
                'NUMBER_VALIDATED',
                'VERIFICATION_COMPLETED',
                'VERIFICATION_FAILED'
            ),
            allowNull: false
        },
        status: {
            type: DataTypes.ENUM('SUCCESS', 'FAILED', 'WARNING'),
            allowNull: false
        },
        message: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        metadata: {
            type: DataTypes.JSONB,
            allowNull: true,
            comment: 'Additional context data for the log entry'
        },
        processing_time: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: 'Processing time in milliseconds'
        },
        timestamp: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        }
    }, {
        tableName: 'aadhaar_verification_logs',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        indexes: [
            {
                fields: ['verification_id']
            },
            {
                fields: ['action']
            },
            {
                fields: ['status']
            },
            {
                fields: ['timestamp']
            }
        ]
    });

    AadhaarVerificationLog.associate = function(models) {
        AadhaarVerificationLog.belongsTo(models.AadhaarVerification, {
            foreignKey: 'verification_id',
            as: 'verification'
        });
    };

    return AadhaarVerificationLog;
};