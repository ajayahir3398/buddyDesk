const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require("../models");
const User = db.User;
const SessionLog = db.SessionLog;
const TokenBlacklist = db.TokenBlacklist; // Added TokenBlacklist import
const ReferralLog = db.ReferralLog; // Added ReferralLog import
const UserProfile = db.UserProfile; // Added UserProfile import
const WorkProfile = db.WorkProfile; // Added WorkProfile import
const UserSkill = db.UserSkill; // Added UserSkill import
const Address = db.Address; // Added Address import
const Post = db.Post; // Added Post import
const Skill = db.Skill; // Added Skill import
const SubSkill = db.SubSkill; // Added SubSkill import
const PostAttachment = db.PostAttachment; // Added PostAttachment import
const TempAddress = db.TempAddress; // Added TempAddress import
const NotificationSettings = db.NotificationSettings; // Added NotificationSettings import
const TermsAcceptance = db.TermsAcceptance; // Added TermsAcceptance import
const UserBlock = db.UserBlock; // Added UserBlock import
const Subscription = db.Subscription; // Added Subscription import
const PasswordResetOTP = db.PasswordResetOTP; // Added PasswordResetOTP import
const emailService = require('../services/emailService'); // Added email service import

// Generate access token (short-lived)
const generateAccessToken = (user) => {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      type: 'access'
    },
    process.env.JWT_SECRET,
    { expiresIn: '365d' }
  );
};

// Generate refresh token (long-lived)
const generateRefreshToken = (user) => {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      type: 'refresh'
    },
    process.env.JWT_SECRET,
    { expiresIn: '365d' }
  );
};

// Register a new user
exports.register = async (req, res) => {
  try {
    const { name, email, password, referred_by } = req.body; // Added referred_by

    // Generate a unique referral code for the new user
    let referralCode;
    let isUnique = false;
    while (!isUnique) {
      referralCode = Math.random().toString(36).substring(2, 8).toUpperCase(); // Simple 6-char alphanumeric code
      const existingReferralUser = await User.findOne({ where: { referral_code: referralCode } });
      if (!existingReferralUser) {
        isUnique = true;
      }
    }

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'User with this email already exists'
        });
      }

    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      referral_code: referralCode, // Store the generated referral code
      referred_by: referred_by, // Store the referral code of who invited them
      created_at: new Date()
    });

    // Log referral if referred_by is present
    if (referred_by) {
      const referrer = await User.findOne({ where: { referral_code: referred_by } });
      if (referrer) {
        await ReferralLog.create({
          referrer_id: referrer.id,
          referee_id: user.id,
          status: 'signed_up',
          created_at: new Date()
        });
      }
    }

    res.status(201).json({
      success: true,
      message: 'User registered successfully'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Login user with email and password
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists (including soft deleted users)
    const user = await User.findOne({ 
      where: { email },
      paranoid: false // Include soft deleted users
    });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email.'
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid password.'
      });
    }

    // Check if user is soft deleted and handle reactivation
    if (user.deleted_at) {
      const deletedDate = new Date(user.deleted_at);
      const currentDate = new Date();
      const daysSinceDeletion = Math.floor((currentDate - deletedDate) / (1000 * 60 * 60 * 24));

      if (daysSinceDeletion > 90) {
        return res.status(401).json({
          success: false,
          message: 'Account has been permanently deleted. Please contact support for assistance.'
        });
      }

      // Reactivate the user account
      await user.restore(); // This removes the deleted_at timestamp
      
      // Log the reactivation
      console.log(`User ${user.id} (${user.email}) account reactivated after ${daysSinceDeletion} days`);
    }

    // Invalidate all existing active sessions for this user (single device login enforcement)
    await SessionLog.update(
      {
        is_active: false,
        revoked_at: new Date(),
        reason: 'New login from another device'
      },
      {
        where: {
          user_id: user.id,
          is_active: true
        }
      }
    );

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Save refresh token to session_logs
    await SessionLog.create({
      user_id: user.id,
      refresh_token: refreshToken,
      user_agent: req.get('User-Agent'),
      ip_address: req.ip || req.connection.remoteAddress,
      is_active: true,
      created_at: new Date()
    });

    // Set refresh token as HttpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      access_token: accessToken
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Refresh access token
exports.refreshToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token not found'
      });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);

    if (decoded.type !== 'refresh') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token type'
      });
    }

    // Check if refresh token exists in session_logs and is active
    const sessionLog = await SessionLog.findOne({
      where: {
        refresh_token: refreshToken,
        is_active: true
      }
    });

    if (!sessionLog) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    // Get user data
    const user = await User.findByPk(decoded.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    // Generate new access token
    const newAccessToken = generateAccessToken(user);

    // Update last_used_at in session_logs
    await sessionLog.update({
      last_used_at: new Date()
    });

    res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        accessToken: newAccessToken
      }
    });

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Refresh token expired'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Logout user
exports.logout = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    const authHeader = req.headers['authorization'];
    const accessToken = authHeader && authHeader.split(' ')[1];

    if (refreshToken) {
      // Mark session as inactive
      await SessionLog.update(
        {
          is_active: false,
          revoked_at: new Date(),
          reason: 'User logout'
        },
        {
          where: {
            refresh_token: refreshToken,
            is_active: true
          }
        }
      );
    }

    // Blacklist access token if provided
    if (accessToken) {
      try {
        const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);
        await TokenBlacklist.create({
          token: accessToken,
          expired_at: new Date(decoded.exp * 1000),
          reason: 'User logout'
        });
      } catch (error) {
        // Token might be invalid or expired, ignore
        console.log('Access token blacklist error:', error.message);
      }
    }

    // Clear refresh token cookie
    res.clearCookie('refreshToken');

    res.status(200).json({
      success: true,
      message: 'Logout successful'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get user profile with all related data
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id; // From authentication middleware

    // Get referred user count
    const referredUserCount = await ReferralLog.count({
      where: {
        referrer_id: userId
      }
    });

    const user = await User.findByPk(userId, {
      include: [
        {
          model: UserProfile,
          as: 'profile',
          attributes: ['id', 'phone', 'dob', 'gender', 'bio', 'image_path', 'looking_skills', 'created_at', 'updated_at']
        },
        {
          model: WorkProfile,
          as: 'workProfiles',
          attributes: ['id', 'company_name', 'designation', 'start_date', 'end_date', 'created_at', 'updated_at'],
          include: [
            {
              model: UserSkill,
              as: 'userSkills',
              attributes: ['id', 'proficiency_level', 'created_at', 'updated_at'],
              include: [
                {
                  model: Skill,
                  as: 'skill',
                  attributes: ['id', 'name', 'description']
                },
                {
                  model: SubSkill,
                  as: 'subSkill',
                  attributes: ['id', 'name', 'description']
                }
              ]
            }
          ]
        },
        {
          model: Address,
          as: 'addresses',
          attributes: ['id', 'street', 'city', 'state', 'zip_code', 'country', 'type', 'created_at', 'updated_at']
        },
        {
          model: TempAddress,
          as: 'tempAddresses',
          attributes: ['id', 'location_data', 'pincode', 'selected_area', 'city', 'state', 'country', 'location_permission', 'is_active', 'expires_at', 'created_at', 'updated_at']
        },
        {
          model: NotificationSettings,
          as: 'notificationSettings',
          attributes: ['id', 'push_notification', 'general_notification', 'skill_exchange_notification', 'message_notification', 'marketing_notification', 'created_at', 'updated_at']
        },
        {
          model: Post,
          as: 'posts',
          attributes: ['id', 'title', 'description', 'medium', 'status', 'deadline', 'created_at', 'updated_at'],
          include: [
            {
              model: Skill,
              as: 'requiredSkill',
              attributes: ['id', 'name', 'description']
            },
            {
              model: SubSkill,
              as: 'requiredSubSkill',
              attributes: ['id', 'name', 'description']
            },
            {
              model: PostAttachment,
              as: 'attachments',
              attributes: ['id', 'file_path', 'file_name', 'mime_type', 'uploaded_at']
            }
          ],
          order: [['created_at', 'DESC']] // Most recent posts first
        }
      ],
      attributes: ['id', 'name', 'email', 'referral_code', 'is_blocked', 'report_count', 'created_at', 'updated_at'],
      order: [
        [{ model: WorkProfile, as: 'workProfiles' }, 'start_date', 'DESC']
      ]
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Helper function to generate full attachment URLs
    const generateAttachmentUrls = (attachments, baseUrl) => {
      if (!attachments || attachments.length === 0) return [];

      return attachments.map((attachment) => {
        // Handle both Sequelize instances and plain objects
        const attachmentData = attachment.toJSON ? attachment.toJSON() : attachment;

        return {
          ...attachmentData,
          url: `${baseUrl}/api/files/${attachmentData.file_path}`,
          // Keep original file_path for backward compatibility
          file_path: attachmentData.file_path,
        };
      });
    };

    // Generate full URLs for attachments AFTER all Sequelize processing
    const baseUrl = `${req.protocol}://${req.get("host")}`;

    // Convert to plain objects and add URLs
    const postsWithUrls = (user.posts || []).map((post) => {
      const postData = post.toJSON ? post.toJSON() : post;

      if (postData.attachments && postData.attachments.length > 0) {
        postData.attachments = generateAttachmentUrls(
          postData.attachments,
          baseUrl
        );
      }

      return postData;
    });

    const defaultNotificationSettings = {
      push_notification: true,
      general_notification: true,
      skill_exchange_notification: true,
      message_notification: true,
      marketing_notification: true
    }
    
    // Check if user has accepted current terms and conditions
    const currentTermsVersion = process.env.CURRENT_TERMS_VERSION || "1.0";
    const termsAcceptance = await TermsAcceptance.findOne({
      where: {
        user_id: userId,
        version: currentTermsVersion
      },
      attributes: ['id', 'version', 'accepted_at'],
      order: [['accepted_at', 'DESC']]
    });
    
    // Get user's active subscription details
    const activeSubscription = await Subscription.findOne({
      where: {
        user_id: userId,
        status: ['active', 'grace_period']
      },
      attributes: ['id', 'platform', 'product_id', 'status', 'is_auto_renewing', 'purchase_date', 'expiry_date', 'is_trial'],
      order: [['expiry_date', 'DESC']]
    });

    const profileData = {
      id: user.id,
      name: user.name,
      email: user.email,
      referral_code: user.referral_code,
      referred_user_count: referredUserCount,
      is_blocked: user.is_blocked || false,
      report_count: user.report_count || 0,
      is_verified: user.is_verified || false,
      subscription_tier: user.subscription_tier || 'free',
      is_subscribed: !!activeSubscription,
      subscription_details: activeSubscription ? {
        id: activeSubscription.id,
        platform: activeSubscription.platform,
        product_id: activeSubscription.product_id,
        status: activeSubscription.status,
        is_auto_renewing: activeSubscription.is_auto_renewing,
        purchase_date: activeSubscription.purchase_date,
        expiry_date: activeSubscription.expiry_date,
        is_trial: activeSubscription.is_trial
      } : null,
      created_at: user.created_at,
      updated_at: user.updated_at,
      profile: user.profile ? {
        ...user.profile.toJSON(),
        image_url: user.profile.image_path ? `${baseUrl}/api/files/${user.profile.image_path}` : null
      } : null,
      work_profiles: user.workProfiles || [],
      addresses: user.addresses || [],
      temp_addresses: user.tempAddresses || [],
      notification_settings: user.notificationSettings || defaultNotificationSettings,
      posts: postsWithUrls,
      terms_accepted: !!termsAcceptance,
      terms_version: currentTermsVersion,
      terms_accepted_at: termsAcceptance ? termsAcceptance.accepted_at : null
    };

    res.status(200).json({
      success: true,
      message: 'Profile retrieved successfully',
      data: profileData
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get profile by user ID (for admin or public profiles)
exports.getProfileById = async (req, res) => {
  try {
    const { id } = req.params;
    const requestingUserId = req.user.id; // Current authenticated user

    // Check if user is requesting their own profile or has permission
    if (parseInt(id) !== requestingUserId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view your own profile.'
      });
    }

    // Get referred user count
    const referredUserCount = await ReferralLog.count({
      where: {
        referrer_id: id
      }
    });

    const user = await User.findByPk(id, {
      include: [
        {
          model: UserProfile,
          as: 'profile',
          attributes: ['id', 'phone', 'dob', 'gender', 'bio', 'image_path', 'looking_skills', 'created_at', 'updated_at']
        },
        {
          model: WorkProfile,
          as: 'workProfiles',
          attributes: ['id', 'company_name', 'designation', 'start_date', 'end_date', 'created_at', 'updated_at'],
          include: [
            {
              model: UserSkill,
              as: 'userSkills',
              attributes: ['id', 'proficiency_level', 'created_at', 'updated_at'],
              include: [
                {
                  model: Skill,
                  as: 'skill',
                  attributes: ['id', 'name', 'description']
                },
                {
                  model: SubSkill,
                  as: 'subSkill',
                  attributes: ['id', 'name', 'description']
                }
              ]
            }
          ]
        },
        {
          model: Address,
          as: 'addresses',
          attributes: ['id', 'street', 'city', 'state', 'zip_code', 'country', 'type', 'created_at', 'updated_at']
        },
        {
          model: TempAddress,
          as: 'tempAddresses',
          attributes: ['id', 'location_data', 'pincode', 'selected_area', 'city', 'state', 'country', 'location_permission', 'is_active', 'expires_at', 'created_at', 'updated_at']
        },
        {
          model: NotificationSettings,
          as: 'notificationSettings',
          attributes: ['id', 'push_notification', 'general_notification', 'skill_exchange_notification', 'message_notification', 'marketing_notification', 'created_at', 'updated_at']
        },
        {
          model: Post,
          as: 'posts',
          attributes: ['id', 'title', 'description', 'medium', 'status', 'deadline', 'created_at', 'updated_at'],
          include: [
            {
              model: Skill,
              as: 'requiredSkill',
              attributes: ['id', 'name', 'description']
            },
            {
              model: SubSkill,
              as: 'requiredSubSkill',
              attributes: ['id', 'name', 'description']
            },
            {
              model: PostAttachment,
              as: 'attachments',
              attributes: ['id', 'file_path', 'file_name', 'mime_type', 'uploaded_at']
            }
          ],
          order: [['created_at', 'DESC']] // Most recent posts first
        }
      ],
      attributes: ['id', 'name', 'email', 'referral_code', 'is_blocked', 'report_count', 'is_verified', 'subscription_tier', 'created_at', 'updated_at'],
      order: [
        [{ model: WorkProfile, as: 'workProfiles' }, 'start_date', 'DESC']
      ]
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Generate full URL for profile image if it exists
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    
    // Check if user has accepted current terms and conditions
    const currentTermsVersion = process.env.CURRENT_TERMS_VERSION || "1.0";
    const termsAcceptance = await TermsAcceptance.findOne({
      where: {
        user_id: id,
        version: currentTermsVersion
      },
      attributes: ['id', 'version', 'accepted_at'],
      order: [['accepted_at', 'DESC']]
    });
    
    // Get user's active subscription details
    const activeSubscription = await Subscription.findOne({
      where: {
        user_id: id,
        status: ['active', 'grace_period']
      },
      attributes: ['id', 'platform', 'product_id', 'status', 'is_auto_renewing', 'purchase_date', 'expiry_date', 'is_trial'],
      order: [['expiry_date', 'DESC']]
    });
    
    const profileData = {
      id: user.id,
      name: user.name,
      email: user.email,
      referral_code: user.referral_code,
      referred_user_count: referredUserCount,
      is_blocked: user.is_blocked || false,
      report_count: user.report_count || 0,
      is_verified: user.is_verified || false,
      subscription_tier: user.subscription_tier || 'free',
      is_subscribed: !!activeSubscription,
      subscription_details: activeSubscription ? {
        id: activeSubscription.id,
        platform: activeSubscription.platform,
        product_id: activeSubscription.product_id,
        status: activeSubscription.status,
        is_auto_renewing: activeSubscription.is_auto_renewing,
        purchase_date: activeSubscription.purchase_date,
        expiry_date: activeSubscription.expiry_date,
        is_trial: activeSubscription.is_trial
      } : null,
      created_at: user.created_at,
      updated_at: user.updated_at,
      profile: user.profile ? {
        ...user.profile.toJSON(),
        image_url: user.profile.image_path ? `${baseUrl}/api/files/${user.profile.image_path}` : null
      } : null,
      work_profiles: user.workProfiles || [],
      addresses: user.addresses || [],
      temp_addresses: user.tempAddresses || [],
      notification_settings: user.notificationSettings || null,
      posts: user.posts || [],
      terms_accepted: !!termsAcceptance,
      terms_version: currentTermsVersion,
      terms_accepted_at: termsAcceptance ? termsAcceptance.accepted_at : null
    };

    res.status(200).json({
      success: true,
      message: 'Profile retrieved successfully',
      data: profileData
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Update user profile (name, email, phone, dob, addresses, temp_addresses, work_profiles)
// Validation is handled by middleware
function CustomError(message, statusCode = 500) {
  const error = new Error(message);
  error.name = "CustomError";
  error.statusCode = statusCode;

  // Ensures proper stack trace (like class version)
  if (Error.captureStackTrace) {
    Error.captureStackTrace(error, CustomError);
  }

  return error;
}

exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { 
      name, email, phone, dob, bio, looking_skills, addresses, temp_addresses, work_profiles,
      notification_settings
    } = req.body;

    const fieldsToUpdate = {};
    const profileFieldsToUpdate = {};

    if (name !== undefined) fieldsToUpdate.name = name;
    if (email !== undefined) fieldsToUpdate.email = email;

    // Handle uploaded profile image
    if (req.file) {
      const path = require('path');
      const uploadsDir = path.join(__dirname, '../uploads');
      // Store relative path from uploads directory
      const relativePath = path.relative(uploadsDir, req.file.path);
      profileFieldsToUpdate.image_path = relativePath.replace(/\\/g, '/');
    }
    if (phone !== undefined) profileFieldsToUpdate.phone = phone;
    if (dob !== undefined) profileFieldsToUpdate.dob = dob || null;
    if (bio !== undefined) profileFieldsToUpdate.bio = bio;
    if (looking_skills !== undefined) profileFieldsToUpdate.looking_skills = looking_skills || [];

    // 🔑 Managed transaction (auto rollback on error)
    await db.sequelize.transaction(async (transaction) => {
      // --- USER TABLE ---
      if (Object.keys(fieldsToUpdate).length > 0) {
        if (fieldsToUpdate.email) {
          const existingUser = await User.findOne({
            where: {
              email: fieldsToUpdate.email,
              id: { [db.Sequelize.Op.ne]: userId }
            },
            transaction
          });
          if (existingUser) {
            throw new CustomError("Email already exists. Please use a different email address.", 409);
          }
        }
        await User.update(fieldsToUpdate, { where: { id: userId }, transaction });
      }

      // --- USER PROFILE ---
      if (Object.keys(profileFieldsToUpdate).length > 0) {
        if (profileFieldsToUpdate.phone) {
          const existingPhone = await UserProfile.findOne({
            where: {
              phone: profileFieldsToUpdate.phone,
              user_id: { [db.Sequelize.Op.ne]: userId }
            },
            transaction
          });
          if (existingPhone) {
            throw new CustomError("Phone number already exists. Please use a different phone.", 409);
          }
        }

        const existingProfile = await UserProfile.findOne({ where: { user_id: userId }, transaction });
        if (existingProfile) {
          await UserProfile.update(profileFieldsToUpdate, { where: { user_id: userId }, transaction });
        } else {
          await UserProfile.create({ user_id: userId, ...profileFieldsToUpdate }, { transaction });
        }
      }

      // --- ADDRESSES ---
      if (addresses !== undefined) {
        await Address.destroy({ where: { user_id: userId }, transaction });
        if (addresses && addresses.length > 0) {
          await Promise.all(addresses.map(address => Address.create({
            user_id: userId,
            street: address.street || null,
            city: address.city || null,
            state: address.state || null,
            zip_code: address.zip_code || null,
            country: address.country || null,
            type: address.type || 'home'
          }, { transaction })));
        }
      }

      // --- TEMP ADDRESSES ---
      if (temp_addresses !== undefined) {
        await TempAddress.destroy({ where: { user_id: userId }, transaction });
        if (temp_addresses && temp_addresses.length > 0) {
          await Promise.all(temp_addresses.map(tempAddress => TempAddress.create({
            user_id: userId,
            location_data: tempAddress.location_data || '',
            pincode: tempAddress.pincode || '',
            selected_area: tempAddress.selected_area || '',
            city: tempAddress.city || null,
            state: tempAddress.state || null,
            country: tempAddress.country || 'India',
            location_permission: !!tempAddress.location_permission,
            is_active: tempAddress.is_active !== undefined ? tempAddress.is_active : true,
            expires_at: tempAddress.expires_at ? new Date(tempAddress.expires_at) : null
          }, { transaction })));
        }
      }

      // --- WORK PROFILES + SKILLS ---
      if (work_profiles !== undefined) {
        const existingWorkProfiles = await WorkProfile.findAll({ where: { user_id: userId }, transaction });

        for (const wp of existingWorkProfiles) {
          await UserSkill.destroy({ where: { work_profile_id: wp.id }, transaction });
        }
        await WorkProfile.destroy({ where: { user_id: userId }, transaction });

        if (work_profiles && work_profiles.length > 0) {
          for (const wp of work_profiles) {
            const newWP = await WorkProfile.create({
              user_id: userId,
              company_name: wp.company_name || null,
              designation: wp.designation || null,
              start_date: wp.start_date ? new Date(wp.start_date) : null,
              end_date: wp.end_date ? new Date(wp.end_date) : null
            }, { transaction });

            if (wp.user_skills && wp.user_skills.length > 0) {
              await Promise.all(wp.user_skills.map(us => UserSkill.create({
                work_profile_id: newWP.id,
                skill_id: us.skill_id,
                sub_skill_id: us.sub_skill_id || null,
                proficiency_level: us.proficiency_level || 'Beginner'
              }, { transaction })));
            }
          }
        }
      }

      // --- NOTIFICATION SETTINGS ---
      if (notification_settings && typeof notification_settings === 'object') {
        const notificationFieldsToUpdate = {};
        
        // Extract individual notification settings from the nested object
        if (notification_settings.push_notification !== undefined) {
          notificationFieldsToUpdate.push_notification = notification_settings.push_notification;
        }
        if (notification_settings.general_notification !== undefined) {
          notificationFieldsToUpdate.general_notification = notification_settings.general_notification;
        }
        if (notification_settings.skill_exchange_notification !== undefined) {
          notificationFieldsToUpdate.skill_exchange_notification = notification_settings.skill_exchange_notification;
        }
        if (notification_settings.message_notification !== undefined) {
          notificationFieldsToUpdate.message_notification = notification_settings.message_notification;
        }
        if (notification_settings.marketing_notification !== undefined) {
          notificationFieldsToUpdate.marketing_notification = notification_settings.marketing_notification;
        }

        if (Object.keys(notificationFieldsToUpdate).length > 0) {
        const existingNotificationSettings = await NotificationSettings.findOne({ where: { user_id: userId }, transaction });
        if (existingNotificationSettings) {
          await NotificationSettings.update(notificationFieldsToUpdate, { where: { user_id: userId }, transaction });
        } else {
          // Create new notification settings with default values for unspecified fields
          const defaultSettings = {
            user_id: userId,
            push_notification: true,
            general_notification: true,
            skill_exchange_notification: true,
            message_notification: true,
            marketing_notification: false,
            ...notificationFieldsToUpdate // Override defaults with provided values
          };
          await NotificationSettings.create(defaultSettings, { transaction });
        }
        }
      }
    }); // 👈 rollback auto on error

    // --- FETCH UPDATED DATA ---
    const updatedUser = await User.findByPk(userId, {
      include: [
        { model: UserProfile, as: 'profile', attributes: ['id', 'phone', 'dob', 'gender', 'bio', 'image_path', 'looking_skills', 'created_at', 'updated_at'] },
        {
          model: WorkProfile, as: 'workProfiles',
          attributes: ['id', 'company_name', 'designation', 'start_date', 'end_date', 'created_at', 'updated_at'],
          include: [
            {
              model: UserSkill, as: 'userSkills',
              attributes: ['id', 'proficiency_level', 'created_at', 'updated_at'],
              include: [
                { model: Skill, as: 'skill', attributes: ['id', 'name', 'description'] },
                { model: SubSkill, as: 'subSkill', attributes: ['id', 'name', 'description'] }
              ]
            }
          ]
        },
        { model: Address, as: 'addresses', attributes: ['id', 'street', 'city', 'state', 'zip_code', 'country', 'type', 'created_at', 'updated_at'] },
        { model: TempAddress, as: 'tempAddresses', attributes: ['id', 'location_data', 'pincode', 'selected_area', 'city', 'state', 'country', 'location_permission', 'is_active', 'expires_at', 'created_at', 'updated_at'] },
        { model: NotificationSettings, as: 'notificationSettings', attributes: ['id', 'push_notification', 'general_notification', 'skill_exchange_notification', 'message_notification', 'marketing_notification', 'created_at', 'updated_at'] }
      ],
      attributes: ['id', 'name', 'email', 'created_at', 'updated_at'],
      order: [[{ model: WorkProfile, as: 'workProfiles' }, 'start_date', 'DESC']]
    });

    // Generate full URL for profile image if it exists
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        created_at: updatedUser.created_at,
        updated_at: updatedUser.updated_at,
        profile: updatedUser.profile ? {
          ...updatedUser.profile.toJSON(),
          image_url: updatedUser.profile.image_path ? `${baseUrl}/api/files/${updatedUser.profile.image_path}` : null
        } : null,
        work_profiles: updatedUser.workProfiles || [],
        addresses: updatedUser.addresses || [],
        temp_addresses: updatedUser.tempAddresses || [],
        notification_settings: updatedUser.notificationSettings || null
      }
    });

  } catch (error) {
    if (error instanceof CustomError) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    console.error("Update profile error:", error);
    return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};



// Get public profile by user ID (limited details for other users)
exports.getPublicProfile = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id, {
      include: [
        {
          model: UserProfile,
          as: 'profile',
          attributes: ['gender', 'image_path', 'bio', 'looking_skills']
        },
        {
          model: WorkProfile,
          as: 'workProfiles',
          attributes: ['id', 'company_name', 'designation', 'start_date', 'end_date'],
          include: [
            {
              model: UserSkill,
              as: 'userSkills',
              attributes: ['id', 'proficiency_level'],
              include: [
                {
                  model: Skill,
                  as: 'skill',
                  attributes: ['id', 'name', 'description']
                },
                {
                  model: SubSkill,
                  as: 'subSkill',
                  attributes: ['id', 'name', 'description']
                }
              ]
            }
          ],
          order: [['start_date', 'DESC']] // Most recent work experience first
        }
      ],
      attributes: ['id', 'name', 'created_at', 'is_online', 'last_seen', 'is_verified', 'subscription_tier']
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Generate full URL for profile image if it exists
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    
    // Collect all unique skills from work profiles
    const allSkills = [];
    const skillIds = new Set();
    
    user.workProfiles.forEach(work => {
      work.userSkills.forEach(userSkill => {
        const skillId = userSkill.skill?.id;
        const subSkillId = userSkill.subSkill?.id;
        const uniqueKey = `${skillId}-${subSkillId}`;
        
        if (!skillIds.has(uniqueKey)) {
          skillIds.add(uniqueKey);
          allSkills.push({
            skill: userSkill.skill ? {
              id: userSkill.skill.id,
              name: userSkill.skill.name,
              description: userSkill.skill.description
            } : null,
            sub_skill: userSkill.subSkill ? {
              id: userSkill.subSkill.id,
              name: userSkill.subSkill.name,
              description: userSkill.subSkill.description
            } : null,
            proficiency_level: userSkill.proficiency_level
          });
        }
      });
    });

    // Transform the data for public profile
    const publicProfileData = {
      id: user.id,
      name: user.name,
      member_since: user.created_at,
      is_online: user.is_online,
      last_seen: user.last_seen,
      is_verified: user.is_verified,
      subscription_tier: user.subscription_tier,
      profile: {
        gender: user.profile?.gender || null,
        bio: user.profile?.bio || null,
        image_path: user.profile?.image_path || null,
        image_url: user.profile?.image_path ? `${baseUrl}/api/files/${user.profile.image_path}` : null,
        looking_skills: user.profile?.looking_skills || []
      },
      skills: allSkills,
      work_experience: user.workProfiles.map(work => ({
        id: work.id,
        company_name: work.company_name,
        designation: work.designation,
        start_date: work.start_date,
        end_date: work.end_date,
        duration: calculateWorkDuration(work.start_date, work.end_date),
        skills: work.userSkills.map(userSkill => ({
          skill: userSkill.skill ? {
            id: userSkill.skill.id,
            name: userSkill.skill.name,
            description: userSkill.skill.description
          } : null,
          sub_skill: userSkill.subSkill ? {
            id: userSkill.subSkill.id,
            name: userSkill.subSkill.name,
            description: userSkill.subSkill.description
          } : null,
          proficiency_level: userSkill.proficiency_level
        }))
      }))
    };

    res.status(200).json({
      success: true,
      message: 'Public profile retrieved successfully',
      data: publicProfileData
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Change user password
exports.changePassword = async (req, res) => {
  try {
    const { email, new_password } = req.body;

    // Check if user exists with the provided email
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User with this email does not exist, please register yourself'
      });
    }

    // Hash the new password
    const saltRounds = 10;
    const hashedNewPassword = await bcrypt.hash(new_password, saltRounds);

    // Update the user's password
    await User.update(
      { 
        password: hashedNewPassword,
        updated_at: new Date()
      },
      { 
        where: { email } 
      }
    );

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Soft delete user
exports.softDeleteUser = async (req, res) => {
  try {
    const userId = req.user.id; // From authentication middleware

    // Check if user exists and is not already deleted
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Perform soft delete
    await user.destroy(); // This will set deleted_at timestamp due to paranoid mode

    // Invalidate all active sessions for this user
    await SessionLog.update(
      {
        is_active: false,
        revoked_at: new Date(),
        reason: 'User account deleted'
      },
      {
        where: {
          user_id: userId,
          is_active: true
        }
      }
    );

    res.status(200).json({
      success: true,
      message: 'User account has been successfully deleted'
    });

  } catch (error) {
    console.error("Soft delete user error:", error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Helper function to calculate work duration
const calculateWorkDuration = (startDate, endDate) => {
  if (!startDate) return null;

  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : new Date();

  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffMonths / 12);

  if (diffYears > 0) {
    const remainingMonths = diffMonths % 12;
    if (remainingMonths > 0) {
      return `${diffYears} year${diffYears > 1 ? 's' : ''} ${remainingMonths} month${remainingMonths > 1 ? 's' : ''}`;
    }
    return `${diffYears} year${diffYears > 1 ? 's' : ''}`;
  } else if (diffMonths > 0) {
    return `${diffMonths} month${diffMonths > 1 ? 's' : ''}`;
  } else {
    return 'Less than a month';
  }
};

// Block a user
exports.blockUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const blockerId = req.user.id;
    const { reason } = req.body;

    // Validate userId
    if (!userId || isNaN(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID"
      });
    }

    // Check if trying to block self
    if (parseInt(userId) === blockerId) {
      return res.status(400).json({
        success: false,
        message: "You cannot block yourself"
      });
    }

    // Check if user exists
    const userToBlock = await User.findByPk(userId);
    if (!userToBlock) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Check if already blocked
    const existingBlock = await UserBlock.findOne({
      where: {
        blocker_id: blockerId,
        blocked_id: userId
      }
    });

    if (existingBlock) {
      return res.status(400).json({
        success: false,
        message: "User is already blocked"
      });
    }

    // Create block record
    const block = await UserBlock.create({
      blocker_id: blockerId,
      blocked_id: userId,
      reason: reason || null
    });

    res.status(201).json({
      success: true,
      message: "User blocked successfully",
      data: {
        block_id: block.id,
        blocked_user_id: parseInt(userId)
      }
    });

  } catch (error) {
    console.error('Block user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Unblock a user
exports.unblockUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const blockerId = req.user.id;

    // Validate userId
    if (!userId || isNaN(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID"
      });
    }

    // Find block record
    const block = await UserBlock.findOne({
      where: {
        blocker_id: blockerId,
        blocked_id: userId
      }
    });

    if (!block) {
      return res.status(404).json({
        success: false,
        message: "User is not blocked"
      });
    }

    // Delete block record
    await block.destroy();

    res.status(200).json({
      success: true,
      message: "User unblocked successfully",
      data: {
        unblocked_user_id: parseInt(userId)
      }
    });

  } catch (error) {
    console.error('Unblock user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get list of blocked users
exports.getBlockedUsers = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const { count, rows: blocks } = await UserBlock.findAndCountAll({
      where: { blocker_id: userId },
      include: [
        {
          model: User,
          as: 'blocked',
          attributes: ['id', 'name', 'email'],
          include: [
            {
              model: UserProfile,
              as: 'profile',
              attributes: ['image_path', 'bio']
            }
          ]
        }
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset
    });

    // Generate image URLs
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const blockedUsers = blocks.map(block => {
      const userData = block.blocked.toJSON();
      if (userData.profile && userData.profile.image_path) {
        userData.profile.image_url = `${baseUrl}/api/files/${userData.profile.image_path}`;
        delete userData.profile.image_path;
      }
      return {
        block_id: block.id,
        blocked_at: block.created_at,
        reason: block.reason,
        user: userData
      };
    });

    res.status(200).json({
      success: true,
      message: "Blocked users retrieved successfully",
      data: {
        blocked_users: blockedUsers,
        pagination: {
          total: count,
          page,
          limit,
          total_pages: Math.ceil(count / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get blocked users error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Generate OTP (6-digit number)
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Forgot password - Send OTP to email
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Check if user exists
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this email address'
      });
    }

    // Generate OTP
    const otp = generateOTP();
    
    // Hash the OTP before storing
    const saltRounds = 10;
    const hashedOTP = await bcrypt.hash(otp, saltRounds);

    // Set expiration time (10 minutes from now)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    // Delete any existing OTPs for this user
    await PasswordResetOTP.destroy({
      where: { user_id: user.id }
    });

    // Create new OTP record
    await PasswordResetOTP.create({
      user_id: user.id,
      email: email,
      otp: hashedOTP,
      expires_at: expiresAt,
      is_verified: false,
      attempts: 0
    });

    // Send OTP via email
    try {
      await emailService.sendOTPEmail(email, otp, user.name || 'User');
      
      res.status(200).json({
        success: true,
        message: 'OTP has been sent to your email address. Please check your inbox.',
        data: {
          email: email,
          expires_in_minutes: 10
        }
      });
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      
      // Delete the OTP record if email fails
      await PasswordResetOTP.destroy({
        where: { user_id: user.id }
      });

      return res.status(500).json({
        success: false,
        message: 'Failed to send OTP email. Please try again later.',
        error: emailError.message
      });
    }

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Verify OTP
exports.verifyResetOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Find user by email
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this email address'
      });
    }

    // Find the OTP record
    const otpRecord = await PasswordResetOTP.findOne({
      where: {
        user_id: user.id,
        email: email,
        is_verified: false
      },
      order: [['created_at', 'DESC']]
    });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'No OTP request found. Please request a new OTP.'
      });
    }

    // Check if OTP has expired
    if (new Date() > new Date(otpRecord.expires_at)) {
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new OTP.'
      });
    }

    // Check maximum attempts (limit to 5 attempts)
    if (otpRecord.attempts >= 5) {
      return res.status(400).json({
        success: false,
        message: 'Maximum verification attempts exceeded. Please request a new OTP.'
      });
    }

    // Verify OTP
    const isOTPValid = await bcrypt.compare(otp, otpRecord.otp);

    // Increment attempts
    await otpRecord.update({
      attempts: otpRecord.attempts + 1
    });

    if (!isOTPValid) {
      const remainingAttempts = 5 - (otpRecord.attempts + 1);
      return res.status(400).json({
        success: false,
        message: `Invalid OTP. ${remainingAttempts} attempt(s) remaining.`
      });
    }

    // Mark OTP as verified
    await otpRecord.update({
      is_verified: true,
      verified_at: new Date()
    });

    // Generate a temporary token for password reset (valid for 15 minutes)
    const resetToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        otpId: otpRecord.id,
        type: 'password_reset'
      },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    res.status(200).json({
      success: true,
      message: 'OTP verified successfully. You can now reset your password.',
      data: {
        reset_token: resetToken,
        expires_in_minutes: 15
      }
    });

  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Reset password with verified OTP
exports.resetPassword = async (req, res) => {
  try {
    const { reset_token, new_password } = req.body;

    // Verify reset token
    let decoded;
    try {
      decoded = jwt.verify(reset_token, process.env.JWT_SECRET);
      
      if (decoded.type !== 'password_reset') {
        return res.status(400).json({
          success: false,
          message: 'Invalid reset token'
        });
      }
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(400).json({
          success: false,
          message: 'Reset token has expired. Please request a new OTP.'
        });
      }
      return res.status(400).json({
        success: false,
        message: 'Invalid reset token'
      });
    }

    // Verify OTP record is still verified and valid
    const otpRecord = await PasswordResetOTP.findOne({
      where: {
        id: decoded.otpId,
        user_id: decoded.userId,
        is_verified: true
      }
    });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset request. Please request a new OTP.'
      });
    }

    // Find user
    const user = await User.findByPk(decoded.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Hash new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(new_password, saltRounds);

    // Update user password
    await user.update({
      password: hashedPassword,
      updated_at: new Date()
    });

    // Delete the OTP record
    await PasswordResetOTP.destroy({
      where: { user_id: user.id }
    });

    // Invalidate all active sessions for security
    await SessionLog.update(
      {
        is_active: false,
        revoked_at: new Date(),
        reason: 'Password reset'
      },
      {
        where: {
          user_id: user.id,
          is_active: true
        }
      }
    );

    // Send password changed confirmation email
    try {
      await emailService.sendPasswordChangedEmail(user.email, user.name || 'User');
    } catch (emailError) {
      console.error('Password changed email error:', emailError);
      // Don't fail the request if email fails
    }

    res.status(200).json({
      success: true,
      message: 'Password has been reset successfully. Please login with your new password.'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};