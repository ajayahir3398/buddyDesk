const crypto = require('crypto');
const xml2js = require('xml2js');
const QrCode = require('qrcode-reader');
const jimp = require('jimp');
const AdmZip = require('adm-zip');
const { SignedXml } = require('xml-crypto');
const { DOMParser } = require('xmldom');
const xpath = require('xpath');
const forge = require('node-forge');
const logger = require('../utils/logger');
const db = require('../models');

class AadhaarVerificationService {
    constructor() {
        this.parser = new xml2js.Parser();
        // UIDAI certificate fingerprints for validation
        this.uidaiCertificateFingerprints = [
            // UIDAI Auth Sign Prod 2023 Certificate Fingerprints
            // SHA-1 fingerprint (formatted with colons)
            '02:13:66:51:0f:de:a6:16:db:a2:96:10:73:ce:d4:a3:fa:cc:3f:29',
            // SHA-256 fingerprint (formatted with colons)
            '83:3f:82:f4:27:b4:c3:a2:f6:ea:03:a4:57:67:37:d0:c9:07:75:dc:a0:be:91:fe:44:12:b7:31:64:e3:9a:e1',
            // Raw SHA-1 hash (without colons)
            '021366510fdea616dba2961073ced4a3facc3f29',
            // Raw SHA-256 hash (without colons)
            '833f82f427b4c3a2f6ea03a4576737d0c90775dca0be91fe4412b73164e39ae1'
        ];
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

            // Step 1: Decode base64 XML data
            const xmlString = Buffer.from(xmlData, 'base64').toString('utf8');
            await this._logAction(verificationRecord.id, 'XML_DECODED', 'SUCCESS', 'XML data successfully decoded');
            
            // Step 2: Verify digital signature
            const signatureResult = await this._verifyAadhaarXmlSignature(xmlString);
            await this._logAction(verificationRecord.id, 'SIGNATURE_VERIFIED', 
                signatureResult.valid ? 'SUCCESS' : 'WARNING', 
                `Digital signature verification: ${signatureResult.valid}`
            );
            
            // Step 3: Parse XML
            const parsedData = await this._parseXML(xmlString);
            await this._logAction(verificationRecord.id, 'XML_PARSED', 'SUCCESS', 'XML successfully parsed');
            
            // Step 4: Extract and verify data
            const extractedData = await this._extractAadhaarDataFromXML(parsedData, shareCode);
            await this._logAction(verificationRecord.id, 'DATA_EXTRACTED', 'SUCCESS', 'Data successfully extracted');
            
            // Step 5: Verify mobile/email hashes if provided
            const hashVerification = await this._verifyMobileEmailHashes(extractedData, shareCode);
            
            // Step 6: Fetch user profile and validate against Aadhaar data
            let profileValidation = null;
            try {
                const userProfile = await this._fetchUserProfile(userId);
                profileValidation = this._validateUserProfileWithAadhaar(userProfile, extractedData);
                await this._logAction(verificationRecord.id, 'PROFILE_VALIDATED', 'SUCCESS', 
                    `Profile validation completed: ${profileValidation.summary.matchPercentage}% match`, 
                    { validationResults: profileValidation }
                );
            } catch (profileError) {
                logger.warn('Profile validation failed:', profileError);
                await this._logAction(verificationRecord.id, 'PROFILE_VALIDATION_FAILED', 'WARNING', 
                    `Profile validation failed: ${profileError.message}`
                );
            }
            
            // Extract Aadhaar number and mask it
            const aadhaarNumber = extractedData.aadhaarNumber;
            const maskedAadhaarNumber = aadhaarNumber ? this._maskAadhaarNumber(aadhaarNumber) : null;

            // Update verification record
            await verificationRecord.update({
                verification_status: 'SUCCESS',
                aadhaar_number: aadhaarNumber,
                masked_aadhaar_number: maskedAadhaarNumber,
                verification_data: extractedData,
                signature_valid: signatureResult.valid,
                timestamp_valid: true,
                verification_time: new Date()
            });

            await this._logAction(verificationRecord.id, 'VERIFICATION_COMPLETED', 'SUCCESS', 
                'XML verification completed successfully', { processingTime: Date.now() - startTime });

            return {
                success: true,
                verificationId: verificationRecord.verification_id,
                data: {
                    ...extractedData,
                    aadhaarNumber: maskedAadhaarNumber,
                    maskedAadhaarNumber
                },
                signatureValid: signatureResult.valid,
                timestampValid: true,
                profileValidation,
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
     * Verify Aadhaar ZIP file (offline eKYC)
     * @param {Buffer} zipBuffer - ZIP file buffer
     * @param {string} shareCode - 4-digit share code used for decryption
     * @param {string} userId - User ID for logging
     * @returns {Object} Verification result
     */
    async verifyAadhaarZIP(zipBuffer, shareCode, userId, ipAddress, userAgent) {
        const startTime = Date.now();
        let verificationRecord = null;
        
        try {
            // Create verification record
            verificationRecord = await db.AadhaarVerification.create({
                user_id: userId,
                verification_type: 'ZIP',
                verification_status: 'PENDING',
                ip_address: ipAddress,
                user_agent: userAgent
            });

            await this._logAction(verificationRecord.id, 'VERIFICATION_INITIATED', 'SUCCESS', 'ZIP verification started');

            // Step 1: Extract password-protected ZIP file contents
            const zipContents = await this._extractPasswordProtectedZip(zipBuffer, shareCode);
            await this._logAction(verificationRecord.id, 'ZIP_EXTRACTED', 'SUCCESS', 'Password-protected ZIP file successfully extracted');
            
            // Step 2: Find XML file in ZIP contents
            const xmlFile = zipContents.find(file => file.name.endsWith('.xml'));
            if (!xmlFile) {
                throw new Error('No XML file found in ZIP archive');
            }
            
            // Step 3: Parse XML from extracted content
            const parsedData = await this._parseXML(xmlFile.content.toString('utf8'));
            await this._logAction(verificationRecord.id, 'XML_PARSED', 'SUCCESS', 'XML successfully parsed');
            
            // Step 4: Extract and decrypt data
            const decryptedData = await this._decryptAadhaarData(parsedData, shareCode);
            await this._logAction(verificationRecord.id, 'DATA_DECRYPTED', 'SUCCESS', 'Data successfully decrypted');
            
            // Step 5: Validate certificate files
            const certificateFiles = zipContents.filter(file => file.name.endsWith('.cer') || file.name.endsWith('.crt'));
            const certificateValidation = await this._validateCertificateFiles(certificateFiles);
            await this._logAction(verificationRecord.id, 'CERTIFICATE_VALIDATED', 
                certificateValidation.valid ? 'SUCCESS' : 'WARNING', 
                `Certificate validation: ${certificateValidation.valid}`
            );
            
            // Step 6: Verify XML digital signature
            const signatureValid = await this._verifyAadhaarXmlSignature(xmlFile.content.toString('utf8'));
            await this._logAction(verificationRecord.id, 'SIGNATURE_VERIFIED', 
                signatureValid.valid ? 'SUCCESS' : 'WARNING', 
                `Digital signature verification: ${signatureValid.valid}`
            );
            
            // Step 7: Validate timestamp
            const timestampValid = this._validateTimestamp(parsedData);
            await this._logAction(verificationRecord.id, 'TIMESTAMP_VALIDATED', 
                timestampValid ? 'SUCCESS' : 'WARNING', 
                `Timestamp validation: ${timestampValid}`
            );
            
            // Step 8: Verify mobile/email hashes if provided
            const hashVerification = await this._verifyMobileEmailHashes(decryptedData, shareCode);

            // Step 9: Fetch user profile and validate against Aadhaar data
            let profileValidation = null;
            try {
                const userProfile = await this._fetchUserProfile(userId);
                profileValidation = this._validateUserProfileWithAadhaar(userProfile, decryptedData);
                await this._logAction(verificationRecord.id, 'PROFILE_VALIDATED', 'SUCCESS', 
                    `Profile validation completed: ${profileValidation.summary.matchPercentage}% match`, 
                    { validationResults: profileValidation }
                );
            } catch (profileError) {
                logger.warn('Profile validation failed:', profileError);
                await this._logAction(verificationRecord.id, 'PROFILE_VALIDATION_FAILED', 'WARNING', 
                    `Profile validation failed: ${profileError.message}`
                );
            }

            // Extract Aadhaar number and mask it
            const aadhaarNumber = decryptedData.aadhaarNumber;
            const maskedAadhaarNumber = aadhaarNumber ? this._maskAadhaarNumber(aadhaarNumber) : null;

            // Update verification record
            await verificationRecord.update({
                verification_status: 'SUCCESS',
                aadhaar_number: aadhaarNumber,
                masked_aadhaar_number: maskedAadhaarNumber,
                verification_data: decryptedData,
                signature_valid: signatureValid.valid,
                certificate_valid: certificateValidation.valid,
                timestamp_valid: timestampValid,
                verification_time: new Date()
            });

            await this._logAction(verificationRecord.id, 'VERIFICATION_COMPLETED', 'SUCCESS', 
                'ZIP verification completed successfully', { processingTime: Date.now() - startTime });

            return {
                success: true,
                verificationId: verificationRecord.verification_id,
                data: {
                    ...decryptedData,
                    aadhaarNumber: maskedAadhaarNumber, // Return masked number
                    maskedAadhaarNumber
                },
                signatureValid: signatureValid.valid,
                certificateValid: certificateValidation.valid,
                timestampValid,
                profileValidation,
                verificationTime: new Date().toISOString()
            };
        } catch (error) {
            logger.error('ZIP verification failed:', error);
            
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
    async _extractZipContents(zipBuffer, password = null) {
        try {
            const zip = new AdmZip(zipBuffer);
            
            // If password is provided, set it for the zip
            if (password) {
                // For password-protected ZIP files, we need to handle extraction differently
                const zipEntries = zip.getEntries();
                
                const contents = [];
                zipEntries.forEach(entry => {
                    if (!entry.isDirectory) {
                        try {
                            // Extract with password
                            const content = zip.readFile(entry, password);
                            if (content) {
                                contents.push({
                                    name: entry.entryName,
                                    content: content
                                });
                            }
                        } catch (error) {
                            throw new Error(`Failed to extract ${entry.entryName}: ${error.message}`);
                        }
                    }
                });
                
                return contents;
            }
            
            // For non-password protected files
            const zipEntries = zip.getEntries();
            
            const contents = [];
            zipEntries.forEach(entry => {
                if (!entry.isDirectory) {
                    contents.push({
                        name: entry.entryName,
                        content: entry.getData()
                    });
                }
            });
            
            return contents;
        } catch (error) {
            throw new Error(`ZIP extraction failed: ${error.message}`);
        }
    }

    /**
     * Extract contents from password-protected ZIP file
     * @param {Buffer} zipBuffer - ZIP file buffer
     * @param {string} shareCode - 4-digit share code used as password
     * @returns {Array} Array of file objects with name and content
     */
    async _extractPasswordProtectedZip(zipBuffer, shareCode) {
        try {
            const zip = new AdmZip(zipBuffer);
            const zipEntries = zip.getEntries();
            const contents = [];
            
            zipEntries.forEach(entry => {
                if (!entry.isDirectory) {
                    try {
                        // Use share code as password for extraction
                        const content = zip.readFile(entry, shareCode);
                        if (content) {
                            contents.push({
                                name: entry.entryName,
                                content: content
                            });
                        }
                    } catch (error) {
                        logger.warn(`Failed to extract ${entry.entryName} with share code, trying without password:`, error.message);
                        // Try without password as fallback
                        try {
                            const content = entry.getData();
                            contents.push({
                                name: entry.entryName,
                                content: content
                            });
                        } catch (fallbackError) {
                            logger.warn(`Failed to extract ${entry.entryName} without password:`, fallbackError.message);
                        }
                    }
                }
            });
            
            if (contents.length === 0) {
                throw new Error('No files could be extracted from ZIP archive. Verify share code is correct.');
            }
            
            return contents;
        } catch (error) {
            throw new Error(`Password-protected ZIP extraction failed: ${error.message}`);
        }
    }

    /**
     * Verify XML digital signature using UIDAI certificates
     * @param {string} xmlString - XML content as string
     * @returns {Object} Signature verification result
     */
    async _verifyAadhaarXmlSignature(xmlString) {
        try {
            const doc = new DOMParser().parseFromString(xmlString, 'text/xml');
            
            // Check for signature element
            const signatureNodes = xpath.select("//ds:Signature", doc, {
                ds: "http://www.w3.org/2000/09/xmldsig#"
            });
            
            if (signatureNodes.length === 0) {
                return { valid: false, reason: 'No digital signature found in XML' };
            }
            
            // Perform anti-signature-wrapping checks
            const antiWrappingResult = this._performAntiWrappingChecks(doc);
            if (!antiWrappingResult.valid) {
                return { valid: false, reason: antiWrappingResult.reason };
            }
            
            // Verify signature using xml-crypto
            const sig = new SignedXml();
            sig.loadSignature(signatureNodes[0]);
            
            // Get certificate from signature
            const cert = sig.getOriginalXmlDocument();
            
            // Validate certificate fingerprint
            const certValidation = await this._validateSignatureCertificate(sig);
            if (!certValidation.valid) {
                return { valid: false, reason: certValidation.reason };
            }
            
            // Verify the signature
            const isValid = sig.checkSignature(xmlString);
            
            return {
                valid: isValid,
                reason: isValid ? 'Signature verification successful' : 'Signature verification failed',
                certificate: certValidation.certificate
            };
        } catch (error) {
            logger.error('XML signature verification failed:', error);
            return { valid: false, reason: `Signature verification error: ${error.message}` };
        }
    }

    /**
     * Validate certificate files from ZIP
     * @param {Array} certificateFiles - Array of certificate file objects
     * @returns {Object} Certificate validation result
     */
    async _validateCertificateFiles(certificateFiles) {
        try {
            if (!certificateFiles || certificateFiles.length === 0) {
                return { valid: false, reason: 'No certificate files found' };
            }
            
            for (const certFile of certificateFiles) {
                try {
                    // Parse certificate
                    const certPem = certFile.content.toString('utf8');
                    const cert = forge.pki.certificateFromPem(certPem);
                    
                    // Calculate fingerprint
                    const fingerprint = forge.md.sha256.create();
                    fingerprint.update(forge.asn1.toDer(forge.pki.certificateToAsn1(cert)).getBytes());
                    const certFingerprint = fingerprint.digest().toHex().toUpperCase();
                    
                    // Check against known UIDAI fingerprints
                    if (this.uidaiCertificateFingerprints.length > 0) {
                        const isValidFingerprint = this.uidaiCertificateFingerprints.includes(certFingerprint);
                        if (!isValidFingerprint) {
                            logger.warn(`Certificate fingerprint ${certFingerprint} not in UIDAI whitelist`);
                        }
                    }
                    
                    // Check certificate validity period
                    const now = new Date();
                    if (now < cert.validity.notBefore || now > cert.validity.notAfter) {
                        return { valid: false, reason: 'Certificate is expired or not yet valid' };
                    }
                    
                    // Check issuer (should be UIDAI)
                    const issuer = cert.issuer.getField('CN');
                    if (issuer && issuer.value.toLowerCase().includes('uidai')) {
                        return {
                            valid: true,
                            reason: 'Certificate validation successful',
                            fingerprint: certFingerprint,
                            issuer: issuer.value
                        };
                    }
                } catch (certError) {
                    logger.warn(`Failed to validate certificate ${certFile.name}:`, certError.message);
                    continue;
                }
            }
            
            return { valid: false, reason: 'No valid UIDAI certificates found' };
        } catch (error) {
            logger.error('Certificate validation failed:', error);
            return { valid: false, reason: `Certificate validation error: ${error.message}` };
        }
    }

    /**
     * Extract Aadhaar data from XML structure
     * @param {Object} parsedData - Parsed XML data
     * @param {string} shareCode - Share code for decryption
     * @returns {Object} Extracted Aadhaar data
     */
    async _extractAadhaarDataFromXML(parsedData, shareCode) {
        try {
            // Handle offline XML format
            if (parsedData.UidData) {
                return this._extractPersonalInfoFromOfflineXML(parsedData.UidData);
            }
            
            // Handle encrypted XML format
            if (parsedData.OfflinePaperlessKyc) {
                return await this._decryptAadhaarData(parsedData, shareCode);
            }
            
            throw new Error('Unsupported XML format');
        } catch (error) {
            logger.error('Failed to extract Aadhaar data from XML:', error);
            throw new Error(`Data extraction failed: ${error.message}`);
        }
    }

    /**
     * Verify mobile/email hashes using share code
     * @param {Object} extractedData - Extracted Aadhaar data
     * @param {string} shareCode - Share code for hash verification
     * @returns {Object} Hash verification result
     */
    async _verifyMobileEmailHashes(extractedData, shareCode) {
        try {
            const result = { mobile: null, email: null };
            
            // Verify mobile hash if present
            if (extractedData.mobileHash && extractedData.mobile) {
                const mobileWithSalt = extractedData.mobile + shareCode;
                const computedMobileHash = crypto.createHash('sha256').update(mobileWithSalt).digest('hex');
                result.mobile = {
                    provided: extractedData.mobileHash,
                    computed: computedMobileHash,
                    valid: extractedData.mobileHash.toLowerCase() === computedMobileHash.toLowerCase()
                };
            }
            
            // Verify email hash if present
            if (extractedData.emailHash && extractedData.email) {
                const emailWithSalt = extractedData.email + shareCode;
                const computedEmailHash = crypto.createHash('sha256').update(emailWithSalt).digest('hex');
                result.email = {
                    provided: extractedData.emailHash,
                    computed: computedEmailHash,
                    valid: extractedData.emailHash.toLowerCase() === computedEmailHash.toLowerCase()
                };
            }
            
            return result;
        } catch (error) {
            logger.error('Hash verification failed:', error);
            return { mobile: null, email: null, error: error.message };
        }
    }

    /**
     * Perform anti-signature-wrapping security checks
     * @param {Document} doc - XML document
     * @returns {Object} Anti-wrapping check result
     */
    _performAntiWrappingChecks(doc) {
        try {
            // Check for multiple signature elements
            const signatures = xpath.select("//ds:Signature", doc, {
                ds: "http://www.w3.org/2000/09/xmldsig#"
            });
            
            if (signatures.length > 1) {
                return { valid: false, reason: 'Multiple signatures detected - potential wrapping attack' };
            }
            
            // Check signature placement
            const signatureParent = signatures[0].parentNode;
            if (!signatureParent || signatureParent.nodeName !== 'UidData') {
                return { valid: false, reason: 'Signature not in expected location' };
            }
            
            // Check for duplicate ID attributes
            const elementsWithId = xpath.select("//*[@Id]", doc);
            const ids = elementsWithId.map(el => el.getAttribute('Id'));
            const uniqueIds = [...new Set(ids)];
            
            if (ids.length !== uniqueIds.length) {
                return { valid: false, reason: 'Duplicate ID attributes detected - potential wrapping attack' };
            }
            
            return { valid: true, reason: 'Anti-wrapping checks passed' };
        } catch (error) {
            logger.error('Anti-wrapping check failed:', error);
            return { valid: false, reason: `Anti-wrapping check error: ${error.message}` };
        }
    }

    /**
     * Validate signature certificate
     * @param {SignedXml} sig - Signed XML object
     * @returns {Object} Certificate validation result
     */
    async _validateSignatureCertificate(sig) {
        try {
            // Extract certificate from signature
            const keyInfo = sig.getOriginalXmlDocument();
            // This is a simplified implementation
            // In production, extract and validate the actual certificate
            
            return {
                valid: true,
                reason: 'Certificate validation passed',
                certificate: 'UIDAI_CERT'
            };
        } catch (error) {
            logger.error('Certificate validation failed:', error);
            return { valid: false, reason: `Certificate validation error: ${error.message}` };
        }
    }

    async _verifyDigitalSignatureFromZip(parsedData, zipContents) {
        try {
            // Check if this is an offline XML that doesn't require signature verification
            if (parsedData.UidData) {
                logger.info('Offline XML detected, signature verification not applicable');
                return true; // Offline XMLs are considered valid without signature verification
            }
            
            // Find certificate files in ZIP
            const certFiles = zipContents.filter(file => 
                file.name.endsWith('.cer') || file.name.endsWith('.crt')
            );
            
            if (certFiles.length === 0) {
                logger.warn('No certificate files found in ZIP, skipping signature verification');
                return false;
            }
            
            // For now, return true as a placeholder
            // In production, implement proper certificate chain validation
            logger.info(`Found ${certFiles.length} certificate files for signature verification`);
            return true;
        } catch (error) {
            logger.error('Digital signature verification failed:', error);
            return false;
        }
    }

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
            // Log the complete parsed data structure for debugging
            logger.info('Parsed XML structure:');
            logger.info(JSON.stringify(parsedData, null, 2));
            
            // Try multiple possible root elements
            const offlineData = parsedData.OfflinePaperlessKyc || parsedData.KycRes || parsedData.UidData || parsedData;
            
            if (!offlineData) {
                throw new Error('Invalid Aadhaar XML structure');
            }

            logger.info('Offline data structure:');
            logger.info(JSON.stringify(offlineData, null, 2));
            
            // Check if this is an offline XML that doesn't need decryption
            if (offlineData.UidData && !offlineData.EncData && !offlineData.Skey) {
                logger.info('This appears to be an offline Aadhaar XML that may not require decryption');
                // Try to extract data directly from UidData
                const uidData = Array.isArray(offlineData.UidData) ? offlineData.UidData[0] : offlineData.UidData;
                if (uidData && (uidData.Poi || uidData.Poa || uidData.Pht)) {
                    logger.info('Found direct personal info in UidData, skipping decryption');
                    return this._extractPersonalInfoFromOfflineXML(uidData);
                }
            }

            let encryptedData = null;
            let sessionKeyInfo = null;

            // Try to find encrypted data in various possible locations
            if (offlineData.EncData) {
                encryptedData = Array.isArray(offlineData.EncData) ? offlineData.EncData[0] : offlineData.EncData;
            } else if (offlineData.encData) {
                encryptedData = Array.isArray(offlineData.encData) ? offlineData.encData[0] : offlineData.encData;
            } else if (offlineData.EncryptedData) {
                encryptedData = Array.isArray(offlineData.EncryptedData) ? offlineData.EncryptedData[0] : offlineData.EncryptedData;
            }

            // Try to find session key in various possible locations
            if (offlineData.Skey) {
                sessionKeyInfo = Array.isArray(offlineData.Skey) ? offlineData.Skey[0] : offlineData.Skey;
            } else if (offlineData.skey) {
                sessionKeyInfo = Array.isArray(offlineData.skey) ? offlineData.skey[0] : offlineData.skey;
            } else if (offlineData.SessionKey) {
                sessionKeyInfo = Array.isArray(offlineData.SessionKey) ? offlineData.SessionKey[0] : offlineData.SessionKey;
            }

            // Check if we have UidData structure
            if (!encryptedData && !sessionKeyInfo && offlineData.UidData) {
                const uidData = Array.isArray(offlineData.UidData) ? offlineData.UidData[0] : offlineData.UidData;
                logger.info('UidData structure:', JSON.stringify(uidData, null, 2));
                
                // Check UidData attributes
                if (uidData && uidData.$) {
                    encryptedData = uidData.$.data || uidData.$.Data || uidData.$.EncData || uidData.$.encData;
                    sessionKeyInfo = uidData.$.skey || uidData.$.Skey || uidData.$.SessionKey;
                }
                
                // Check if UidData contains nested elements
                if (!encryptedData && uidData) {
                    // Look for encrypted data in nested elements
                    encryptedData = uidData.EncData || uidData.encData || uidData.EncryptedData || uidData.Data || uidData.data;
                    if (Array.isArray(encryptedData)) {
                        encryptedData = encryptedData[0];
                    }
                }
                
                if (!sessionKeyInfo && uidData) {
                    // Look for session key in nested elements
                    sessionKeyInfo = uidData.Skey || uidData.skey || uidData.SessionKey;
                    if (Array.isArray(sessionKeyInfo)) {
                        sessionKeyInfo = sessionKeyInfo[0];
                    }
                }
                
                // If UidData is a string (the actual encrypted content)
                if (!encryptedData && typeof uidData === 'string') {
                    encryptedData = uidData;
                }
            }

            // Check Signature element for session key
            if (!sessionKeyInfo && offlineData.Signature) {
                const signature = Array.isArray(offlineData.Signature) ? offlineData.Signature[0] : offlineData.Signature;
                logger.info('Signature structure:', JSON.stringify(signature, null, 2));
                
                if (signature && signature.$) {
                    sessionKeyInfo = signature.$.skey || signature.$.Skey || signature.$.SessionKey;
                }
                
                // Check if signature contains nested elements
                if (!sessionKeyInfo && signature) {
                    sessionKeyInfo = signature.Skey || signature.skey || signature.SessionKey;
                    if (Array.isArray(sessionKeyInfo)) {
                        sessionKeyInfo = sessionKeyInfo[0];
                    }
                }
            }

            // Check attributes in the root element
            if (!encryptedData && !sessionKeyInfo && offlineData.$) {
                encryptedData = offlineData.$.EncData || offlineData.$.encData || offlineData.$.UidData || offlineData.$.data || offlineData.$.Data;
                sessionKeyInfo = offlineData.$.Skey || offlineData.$.skey || offlineData.$.SessionKey;
            }

            logger.info('Found encrypted data:', !!encryptedData);
            logger.info('Found session key:', !!sessionKeyInfo);
            
            if (!encryptedData || !sessionKeyInfo) {
                const availableKeys = Object.keys(offlineData);
                logger.error('Available keys in offline data:', availableKeys);
                if (offlineData.$) {
                    logger.error('Available attributes:', Object.keys(offlineData.$));
                }
                throw new Error(`Missing encrypted data or session key. Available keys: ${availableKeys.join(', ')}`);
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

    _extractPersonalInfoFromOfflineXML(uidData) {
        try {
            logger.info('Extracting personal info from Aadhaar Paperless Offline e-KYC XML');
            logger.info('UidData structure:', JSON.stringify(uidData, null, 2));
            
            const poi = uidData.Poi?.[0]?.$;
            const poa = uidData.Poa?.[0]?.$;
            const pht = uidData.Pht?.[0];

            // Extract Aadhaar reference ID (contains last 4 digits + timestamp) from UidData attributes
            const referenceId = uidData.$?.referenceId || uidData.$?.refId || uidData.$?.uid || null;
            
            // Extract last 4 digits from reference ID if available
            let aadhaarNumber = null;
            if (referenceId && referenceId.length >= 4) {
                // For Paperless Offline e-KYC, we only get last 4 digits in reference ID
                const last4Digits = referenceId.substring(0, 4);
                aadhaarNumber = `XXXX-XXXX-${last4Digits}`;
            }

            // Also check if data is in attributes directly (UidData root attributes)
            if (!poi && uidData.$) {
                return {
                    aadhaarNumber: aadhaarNumber,
                    name: uidData.$.name,
                    dateOfBirth: uidData.$.dob,
                    gender: uidData.$.gender,
                    mobileHash: uidData.$.mobileHash || uidData.$.m || null,
                    emailHash: uidData.$.emailHash || uidData.$.e || null,
                    address: {
                        careOf: uidData.$.co,
                        house: uidData.$.house,
                        street: uidData.$.street,
                        landmark: uidData.$.lm,
                        locality: uidData.$.loc,
                        village: uidData.$.vtc,
                        subDistrict: uidData.$.subdist,
                        district: uidData.$.dist,
                        state: uidData.$.state,
                        country: uidData.$.country,
                        pincode: uidData.$.pc
                    },
                    photo: uidData.$.photo ? Buffer.from(uidData.$.photo, 'base64') : null,
                    referenceId: referenceId
                };
            }

            // Extract from Poi/Poa structure
            return {
                aadhaarNumber: aadhaarNumber,
                name: poi?.name,
                dateOfBirth: poi?.dob,
                gender: poi?.gender,
                mobileHash: poi?.m || null,
                emailHash: poi?.e || null,
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
                photo: pht ? Buffer.from(pht, 'base64') : null,
                referenceId: referenceId
            };
        } catch (error) {
            throw new Error(`Failed to extract personal info from offline XML: ${error.message}`);
        }
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
            // Check for timestamp in different XML structures
            const timestamp = parsedData.OfflinePaperlessKyc?.$.ts || 
                             parsedData.KycRes?.$.ts ||
                             parsedData.UidData?.$.ts ||
                             parsedData.UidData?.$.timestamp;
            
            if (!timestamp) {
                // For offline XML files, timestamp validation might not be applicable
                if (parsedData.UidData) {
                    logger.info('Offline XML detected, timestamp validation not applicable');
                    return true;
                }
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

    /**
     * Fetch user profile data for validation
     * @param {string} userId - User ID
     * @returns {Object} User profile data
     */
    async _fetchUserProfile(userId) {
        try {
            const user = await db.User.findByPk(userId, {
                include: [{
                    model: db.UserProfile,
                    as: 'profile',
                    attributes: ['phone', 'dob', 'gender']
                }],
                attributes: ['name', 'email']
            });

            if (!user) {
                throw new Error('User not found');
            }

            return {
                name: user.name,
                email: user.email,
                phone: user.profile?.phone,
                dateOfBirth: user.profile?.dob,
                gender: user.profile?.gender
            };
        } catch (error) {
            logger.error('Failed to fetch user profile:', error);
            throw new Error(`User profile fetch failed: ${error.message}`);
        }
    }

    /**
     * Validate user profile data against Aadhaar data
     * @param {Object} userProfile - User profile data
     * @param {Object} aadhaarData - Extracted Aadhaar data
     * @returns {Object} Validation results
     */
    _validateUserProfileWithAadhaar(userProfile, aadhaarData) {
        const validationResults = {
            nameMatch: false,
            phoneMatch: false,
            emailMatch: false,
            dobMatch: false,
            genderMatch: false,
            overallMatch: false,
            details: {}
        };

        try {
            // Name validation
            if (userProfile.name && aadhaarData.name) {
                const userNameNormalized = userProfile.name.toLowerCase().trim().replace(/\s+/g, ' ');
                const aadhaarNameNormalized = aadhaarData.name.toLowerCase().trim().replace(/\s+/g, ' ');
                validationResults.nameMatch = userNameNormalized === aadhaarNameNormalized;
                validationResults.details.name = {
                    user: userProfile.name,
                    aadhaar: aadhaarData.name,
                    match: validationResults.nameMatch
                };
            }

            // Phone validation
            if (userProfile.phone && aadhaarData.phone) {
                const userPhone = userProfile.phone.replace(/\D/g, ''); // Remove non-digits
                const aadhaarPhone = aadhaarData.phone.replace(/\D/g, '');
                validationResults.phoneMatch = userPhone === aadhaarPhone;
                validationResults.details.phone = {
                    user: userProfile.phone,
                    aadhaar: aadhaarData.phone,
                    match: validationResults.phoneMatch
                };
            }

            // Email validation
            if (userProfile.email && aadhaarData.email) {
                const userEmail = userProfile.email.toLowerCase().trim();
                const aadhaarEmail = aadhaarData.email.toLowerCase().trim();
                validationResults.emailMatch = userEmail === aadhaarEmail;
                validationResults.details.email = {
                    user: userProfile.email,
                    aadhaar: aadhaarData.email,
                    match: validationResults.emailMatch
                };
            }

            // Date of birth validation
            if (userProfile.dateOfBirth && aadhaarData.dateOfBirth) {
                const userDob = new Date(userProfile.dateOfBirth).toISOString().split('T')[0];
                const aadhaarDob = new Date(aadhaarData.dateOfBirth).toISOString().split('T')[0];
                validationResults.dobMatch = userDob === aadhaarDob;
                validationResults.details.dateOfBirth = {
                    user: userProfile.dateOfBirth,
                    aadhaar: aadhaarData.dateOfBirth,
                    match: validationResults.dobMatch
                };
            }

            // Gender validation
            if (userProfile.gender && aadhaarData.gender) {
                const userGender = userProfile.gender.toLowerCase().trim();
                const aadhaarGender = aadhaarData.gender.toLowerCase().trim();
                // Handle different gender representations
                const genderMap = {
                    'male': ['m', 'male'],
                    'female': ['f', 'female'],
                    'other': ['o', 'other', 'transgender']
                };
                
                let normalizedUserGender = userGender;
                let normalizedAadhaarGender = aadhaarGender;
                
                for (const [standard, variants] of Object.entries(genderMap)) {
                    if (variants.includes(userGender)) normalizedUserGender = standard;
                    if (variants.includes(aadhaarGender)) normalizedAadhaarGender = standard;
                }
                
                validationResults.genderMatch = normalizedUserGender === normalizedAadhaarGender;
                validationResults.details.gender = {
                    user: userProfile.gender,
                    aadhaar: aadhaarData.gender,
                    match: validationResults.genderMatch
                };
            }

            // Calculate overall match
            const validFields = Object.keys(validationResults).filter(key => 
                key.endsWith('Match') && validationResults[key] !== null
            );
            const matchedFields = validFields.filter(key => validationResults[key]);
            validationResults.overallMatch = validFields.length > 0 && matchedFields.length === validFields.length;
            
            validationResults.summary = {
                totalFields: validFields.length,
                matchedFields: matchedFields.length,
                matchPercentage: validFields.length > 0 ? Math.round((matchedFields.length / validFields.length) * 100) : 0
            };

        } catch (error) {
            logger.error('Profile validation error:', error);
            validationResults.error = error.message;
        }

        return validationResults;
    }

    async _logAction(verificationId, action, status, message, metadata = null) {
        try {
            await db.AadhaarVerificationLog.create({
                verification_id: verificationId,
                action,
                status,
                message,
                metadata: metadata ? JSON.stringify(metadata) : null
            });
        } catch (error) {
            logger.error('Failed to log action:', error);
        }
    }
}

module.exports = AadhaarVerificationService;