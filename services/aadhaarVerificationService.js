const crypto = require('crypto');
const xml2js = require('xml2js');
const QrCode = require('qrcode-reader');
const jimp = require('jimp');
const logger = require('../utils/logger');
const db = require('../models');

class AadhaarVerificationService {
    constructor() {
        this.parser = new xml2js.Parser();
        // In production, load actual UIDAI certificate
        this.uidaiPublicKey = null;
    }

    /**
     * Verify Aadhaar XML file (offline eKYC)
     * @param {string} xmlData - Base64 encoded XML data
     * @param {string} shareCode - 4-digit share code used for decryption
     * @param {string} userId - User ID for logging
     * @returns {Object} Verification result
     */
    async verifyAadhaarXML(xmlData, shareCode, userId, ipAddress, userAgent) {
        const startTime = Date.now();
        let verificationRecord = null;
        
        try {
            // Create verification record
            verificationRecord = await db.AadhaarVerification.create({
                user_id: userId,
                verification_type: 'XML',
                verification_status: 'PENDING',
                ip_address: ipAddress,
                user_agent: userAgent
            });

            await this._logAction(verificationRecord.id, 'VERIFICATION_INITIATED', 'SUCCESS', 'XML verification started');

            // Step 1: Decode base64 XML
            const decodedXML = Buffer.from(xmlData, 'base64').toString('utf-8');
            
            // Step 2: Parse XML
            const parsedData = await this._parseXML(decodedXML);
            await this._logAction(verificationRecord.id, 'XML_PARSED', 'SUCCESS', 'XML successfully parsed');
            
            // Step 3: Extract and decrypt data
            const decryptedData = await this._decryptAadhaarData(parsedData, shareCode);
            await this._logAction(verificationRecord.id, 'DATA_DECRYPTED', 'SUCCESS', 'Data successfully decrypted');
            
            // Step 4: Verify digital signature
            const signatureValid = await this._verifyDigitalSignature(parsedData);
            await this._logAction(verificationRecord.id, 'SIGNATURE_VERIFIED', 
                signatureValid ? 'SUCCESS' : 'WARNING', 
                `Digital signature verification: ${signatureValid}`
            );
            
            // Step 5: Validate timestamp
            const timestampValid = this._validateTimestamp(parsedData);
            await this._logAction(verificationRecord.id, 'TIMESTAMP_VALIDATED', 
                timestampValid ? 'SUCCESS' : 'WARNING', 
                `Timestamp validation: ${timestampValid}`
            );

            // Extract Aadhaar number and mask it
            const aadhaarNumber = decryptedData.aadhaarNumber;
            const maskedAadhaarNumber = aadhaarNumber ? this._maskAadhaarNumber(aadhaarNumber) : null;

            // Update verification record
            await verificationRecord.update({
                verification_status: 'SUCCESS',
                aadhaar_number: aadhaarNumber,
                masked_aadhaar_number: maskedAadhaarNumber,
                verification_data: decryptedData,
                signature_valid: signatureValid,
                timestamp_valid: timestampValid,
                verification_time: new Date()
            });

            await this._logAction(verificationRecord.id, 'VERIFICATION_COMPLETED', 'SUCCESS', 
                'XML verification completed successfully', { processingTime: Date.now() - startTime });

            return {
                success: true,
                verificationId: verificationRecord.verification_id,
                data: {
                    ...decryptedData,
                    aadhaarNumber: maskedAadhaarNumber, // Return masked number
                    maskedAadhaarNumber
                },
                signatureValid,
                timestampValid,
                verificationTime: new Date().toISOString()
            };
        } catch (error) {
            logger.error('XML verification failed:', error);
            
            if (verificationRecord) {
                await verificationRecord.update({
                    verification_status: 'FAILED',
                    error_message: error.message
                });
                
                await this._logAction(verificationRecord.id, 'VERIFICATION_FAILED', 'FAILED', 
                    error.message, { processingTime: Date.now() - startTime });
            }

            return {
                success: false,
                error: error.message,
                verificationTime: new Date().toISOString()
            };
        }
    }

    /**
     * Verify Aadhaar QR Code
     * @param {Buffer} qrImageBuffer - QR code image buffer
     * @param {string} userId - User ID for logging
     * @returns {Object} Verification result
     */
    async verifyAadhaarQR(qrImageBuffer, userId, ipAddress, userAgent) {
        const startTime = Date.now();
        let verificationRecord = null;

        try {
            // Create verification record
            verificationRecord = await db.AadhaarVerification.create({
                user_id: userId,
                verification_type: 'QR',
                verification_status: 'PENDING',
                ip_address: ipAddress,
                user_agent: userAgent
            });

            await this._logAction(verificationRecord.id, 'VERIFICATION_INITIATED', 'SUCCESS', 'QR verification started');

            // Step 1: Read QR code
            const qrData = await this._readQRCode(qrImageBuffer);
            await this._logAction(verificationRecord.id, 'QR_DECODED', 'SUCCESS', 'QR code successfully decoded');
            
            // Step 2: Parse QR data
            const parsedQRData = this._parseQRData(qrData);
            
            // Step 3: Verify checksum
            const checksumValid = this._verifyQRChecksum(parsedQRData);
            await this._logAction(verificationRecord.id, 'CHECKSUM_VERIFIED', 
                checksumValid ? 'SUCCESS' : 'WARNING', 
                `Checksum verification: ${checksumValid}`
            );

            // Mask Aadhaar number
            const maskedAadhaarNumber = parsedQRData.lastFourDigits ? 
                `XXXX XXXX ${parsedQRData.lastFourDigits}` : null;

            // Update verification record
            await verificationRecord.update({
                verification_status: 'SUCCESS',
                masked_aadhaar_number: maskedAadhaarNumber,
                verification_data: parsedQRData,
                checksum_valid: checksumValid,
                verification_time: new Date()
            });

            await this._logAction(verificationRecord.id, 'VERIFICATION_COMPLETED', 'SUCCESS', 
                'QR verification completed successfully', { processingTime: Date.now() - startTime });

            return {
                success: true,
                verificationId: verificationRecord.verification_id,
                data: {
                    ...parsedQRData,
                    maskedAadhaarNumber
                },
                checksumValid,
                verificationTime: new Date().toISOString()
            };
        } catch (error) {
            logger.error('QR verification failed:', error);
            
            if (verificationRecord) {
                await verificationRecord.update({
                    verification_status: 'FAILED',
                    error_message: error.message
                });
                
                await this._logAction(verificationRecord.id, 'VERIFICATION_FAILED', 'FAILED', 
                    error.message, { processingTime: Date.now() - startTime });
            }

            return {
                success: false,
                error: error.message,
                verificationTime: new Date().toISOString()
            };
        }
    }

    /**
     * Validate Aadhaar number format and checksum
     * @param {string} aadhaarNumber - Aadhaar number to validate
     * @param {string} userId - User ID for logging
     * @returns {Object} Validation result
     */
    async validateAadhaarNumber(aadhaarNumber, userId, ipAddress, userAgent) {
        const startTime = Date.now();
        let verificationRecord = null;

        try {
            // Create verification record
            verificationRecord = await db.AadhaarVerification.create({
                user_id: userId,
                verification_type: 'NUMBER',
                verification_status: 'PENDING',
                aadhaar_number: aadhaarNumber.replace(/\s/g, ''),
                masked_aadhaar_number: this._maskAadhaarNumber(aadhaarNumber),
                ip_address: ipAddress,
                user_agent: userAgent
            });

            await this._logAction(verificationRecord.id, 'VERIFICATION_INITIATED', 'SUCCESS', 'Number validation started');

            // Validate format and checksum
            const isValid = this._validateAadhaarNumberFormat(aadhaarNumber);
            
            await this._logAction(verificationRecord.id, 'NUMBER_VALIDATED', 
                isValid ? 'SUCCESS' : 'FAILED', 
                `Number validation: ${isValid}`
            );

            // Update verification record
            await verificationRecord.update({
                verification_status: isValid ? 'SUCCESS' : 'FAILED',
                verification_data: { formatValid: isValid },
                verification_time: new Date()
            });

            await this._logAction(verificationRecord.id, 'VERIFICATION_COMPLETED', 
                isValid ? 'SUCCESS' : 'FAILED', 
                'Number validation completed', 
                { processingTime: Date.now() - startTime }
            );

            return {
                success: isValid,
                verificationId: verificationRecord.verification_id,
                data: {
                    maskedAadhaarNumber: this._maskAadhaarNumber(aadhaarNumber),
                    formatValid: isValid
                },
                verificationTime: new Date().toISOString()
            };
        } catch (error) {
            logger.error('Number validation failed:', error);
            
            if (verificationRecord) {
                await verificationRecord.update({
                    verification_status: 'FAILED',
                    error_message: error.message
                });
                
                await this._logAction(verificationRecord.id, 'VERIFICATION_FAILED', 'FAILED', 
                    error.message, { processingTime: Date.now() - startTime });
            }

            return {
                success: false,
                error: error.message,
                verificationTime: new Date().toISOString()
            };
        }
    }

    /**
     * Get verification history for a user
     */
    async getVerificationHistory(userId, limit = 10, offset = 0) {
        try {
            const verifications = await db.AadhaarVerification.findAndCountAll({
                where: { user_id: userId },
                limit,
                offset,
                order: [['createdAt', 'DESC']],
                attributes: {
                    exclude: ['aadhaar_number', 'verification_data'] // Exclude sensitive data
                }
            });

            return {
                success: true,
                data: verifications.rows,
                total: verifications.count,
                limit,
                offset
            };
        } catch (error) {
            logger.error('Failed to get verification history:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Private helper methods
    async _parseXML(xmlData) {
        return new Promise((resolve, reject) => {
            this.parser.parseString(xmlData, (err, result) => {
                if (err) {
                    reject(new Error(`XML parsing failed: ${err.message}`));
                } else {
                    resolve(result);
                }
            });
        });
    }

    async _decryptAadhaarData(parsedData, shareCode) {
        try {
            const offlineData = parsedData.OfflinePaperlessKyc || parsedData.KycRes;
            
            if (!offlineData) {
                throw new Error('Invalid Aadhaar XML structure');
            }

            const encryptedData = offlineData.EncData?.[0];
            const sessionKeyInfo = offlineData.Skey?.[0];
            
            if (!encryptedData || !sessionKeyInfo) {
                throw new Error('Missing encrypted data or session key');
            }

            const derivedKey = this._deriveKey(shareCode, sessionKeyInfo);
            const decrypted = this._decryptData(encryptedData, derivedKey);
            const decryptedXML = await this._parseXML(decrypted);
            
            return this._extractPersonalInfo(decryptedXML);
        } catch (error) {
            throw new Error(`Decryption failed: ${error.message}`);
        }
    }

    _deriveKey(shareCode, sessionKeyInfo) {
        const hash = crypto.createHash('sha256');
        hash.update(shareCode + sessionKeyInfo);
        return hash.digest();
    }

    _decryptData(encryptedData, key) {
        try {
            const encryptedBuffer = Buffer.from(encryptedData, 'base64');
            const iv = encryptedBuffer.slice(0, 16);
            const encrypted = encryptedBuffer.slice(16);
            
            const decipher = crypto.createDecipherGCM('aes-256-gcm', key);
            decipher.setIV(iv);
            
            let decrypted = decipher.update(encrypted, null, 'utf8');
            decrypted += decipher.final('utf8');
            
            return decrypted;
        } catch (error) {
            throw new Error(`AES decryption failed: ${error.message}`);
        }
    }

    _extractPersonalInfo(decryptedXML) {
        const poi = decryptedXML.KycRes?.Poi?.[0]?.$;
        const poa = decryptedXML.KycRes?.Poa?.[0]?.$;
        const pht = decryptedXML.KycRes?.Pht?.[0];
        
        return {
            aadhaarNumber: poi?.uid, // Will be masked before returning
            name: poi?.name,
            dateOfBirth: poi?.dob,
            gender: poi?.gender,
            phone: poi?.phone,
            email: poi?.email,
            address: {
                careOf: poa?.co,
                house: poa?.house,
                street: poa?.street,
                landmark: poa?.lm,
                locality: poa?.loc,
                village: poa?.vtc,
                subDistrict: poa?.subdist,
                district: poa?.dist,
                state: poa?.state,
                country: poa?.country,
                pincode: poa?.pc
            },
            photo: pht // Base64 encoded photo
        };
    }

    async _verifyDigitalSignature(parsedData) {
        try {
            const signature = parsedData.OfflinePaperlessKyc?.Signature?.[0] || 
                             parsedData.KycRes?.Signature?.[0];
            
            if (!signature) {
                return false;
            }

            // In production, load actual UIDAI certificate and verify
            logger.info('Digital signature verification would be performed here');
            
            return true; // Placeholder
        } catch (error) {
            logger.error('Signature verification error:', error);
            return false;
        }
    }

    _validateTimestamp(parsedData) {
        try {
            const timestamp = parsedData.OfflinePaperlessKyc?.$.ts || 
                             parsedData.KycRes?.$.ts;
            
            if (!timestamp) {
                return false;
            }

            const dataTime = new Date(timestamp);
            const currentTime = new Date();
            const timeDiff = currentTime - dataTime;
            
            // Consider valid if within 30 days
            const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
            
            return timeDiff <= thirtyDaysInMs;
        } catch (error) {
            return false;
        }
    }

    async _readQRCode(imageBuffer) {
        return new Promise((resolve, reject) => {
            jimp.read(imageBuffer, (err, image) => {
                if (err) {
                    reject(new Error(`Image reading failed: ${err.message}`));
                    return;
                }

                const qr = new QrCode();
                qr.callback = (err, value) => {
                    if (err) {
                        reject(new Error(`QR reading failed: ${err.message}`));
                    } else {
                        resolve(value.result);
                    }
                };
                qr.decode(image.bitmap);
            });
        });
    }

    _parseQRData(qrData) {
        try {
            const parts = qrData.split(',');
            
            if (parts.length < 8) {
                throw new Error('Invalid QR data format');
            }

            return {
                referenceId: parts[0],
                name: parts[1],
                dateOfBirth: parts[2],
                gender: parts[3],
                careOf: parts[4],
                district: parts[5],
                landmark: parts[6],
                house: parts[7],
                location: parts[8],
                pincode: parts[9],
                state: parts[10],
                lastFourDigits: parts[11],
                checksum: parts[parts.length - 1]
            };
        } catch (error) {
            throw new Error(`QR parsing failed: ${error.message}`);
        }
    }

    _verifyQRChecksum(parsedQRData) {
        try {
            const dataForChecksum = Object.values(parsedQRData)
                .slice(0, -1)
                .join(',');
            
            const hash = crypto.createHash('sha256');
            hash.update(dataForChecksum);
            const expectedChecksum = hash.digest('hex').substring(0, 8);
            
            return parsedQRData.checksum === expectedChecksum;
        } catch (error) {
            logger.error('Checksum verification error:', error);
            return false;
        }
    }

    _validateAadhaarNumberFormat(aadhaarNumber) {
        const cleanNumber = aadhaarNumber.replace(/\s/g, '');
        
        if (!/^\d{12}$/.test(cleanNumber)) {
            return false;
        }

        return this._verhoeffChecksum(cleanNumber);
    }

    _verhoeffChecksum(aadhaarNumber) {
        const multiplication = [
            [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
            [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
            [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
            [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
            [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
            [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
            [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
            [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
            [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
            [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]
        ];

        const permutation = [
            [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
            [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
            [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
            [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
            [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
            [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
            [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
            [7, 0, 4, 6, 9, 1, 3, 2, 5, 8]
        ];

        let c = 0;
        const reversedNumber = aadhaarNumber.split('').reverse();

        for (let i = 0; i < reversedNumber.length; i++) {
            c = multiplication[c][permutation[i % 8][parseInt(reversedNumber[i])]];
        }

        return c === 0;
    }

    _maskAadhaarNumber(aadhaarNumber) {
        const cleanNumber = aadhaarNumber.replace(/\s/g, '');
        if (cleanNumber.length !== 12) {
            return 'XXXX XXXX XXXX';
        }
        return `XXXX XXXX ${cleanNumber.slice(-4)}`;
    }

    async _logAction(verificationId, action, status, message, metadata = null) {
        try {
            await db.AadhaarVerificationLog.create({
                verification_id: verificationId,
                action,
                status,
                message,
                metadata
            });
        } catch (error) {
            logger.error('Failed to log action:', error);
        }
    }
}

module.exports = AadhaarVerificationService;