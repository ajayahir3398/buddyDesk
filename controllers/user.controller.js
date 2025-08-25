const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require("../models");
const User = db.User;
const SessionLog = db.SessionLog;
const TokenBlacklist = db.TokenBlacklist; // Added TokenBlacklist import
const UserProfile = db.UserProfile; // Added UserProfile import
const WorkProfile = db.WorkProfile; // Added WorkProfile import
const UserSkill = db.UserSkill; // Added UserSkill import
const Address = db.Address; // Added Address import
const Post = db.Post; // Added Post import
const Skill = db.Skill; // Added Skill import
const SubSkill = db.SubSkill; // Added SubSkill import
const PostAttachment = db.PostAttachment; // Added PostAttachment import
const TempAddress = db.TempAddress; // Added TempAddress import

// Generate access token (short-lived)
const generateAccessToken = (user) => {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      type: 'access'
    },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
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
    { expiresIn: '30d' }
  );
};

// Register a new user
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

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
      created_at: new Date()
    });

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

    // Check if user exists
    const user = await User.findOne({ where: { email } });
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

    const user = await User.findByPk(userId, {
      include: [
        {
          model: UserProfile,
          as: 'profile',
          attributes: ['id', 'phone', 'dob', 'gender', 'created_at', 'updated_at']
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
      attributes: ['id', 'name', 'email', 'created_at', 'updated_at'],
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

    // Transform the data for better response structure
    const profileData = {
      id: user.id,
      name: user.name,
      email: user.email,
      created_at: user.created_at,
      updated_at: user.updated_at,
      profile: user.profile || null,
      work_profiles: user.workProfiles || [],
      addresses: user.addresses || [],
      temp_addresses: user.tempAddresses || [],
      posts: user.posts || []
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

    const user = await User.findByPk(id, {
      include: [
        {
          model: UserProfile,
          as: 'profile',
          attributes: ['id', 'phone', 'dob', 'gender', 'created_at', 'updated_at']
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
      attributes: ['id', 'name', 'email', 'created_at', 'updated_at'],
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

    const profileData = {
      id: user.id,
      name: user.name,
      email: user.email,
      created_at: user.created_at,
      updated_at: user.updated_at,
      profile: user.profile || null,
      work_profiles: user.workProfiles || [],
      addresses: user.addresses || [],
      temp_addresses: user.tempAddresses || [],
      posts: user.posts || []
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

// Update user profile (name, email, phone, dob, addresses, temp_addresses)
// Validation is handled by middleware
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, email, phone, dob, addresses, temp_addresses } = req.body;

    // Prepare update data (validation already done by middleware)
    const fieldsToUpdate = {};
    const profileFieldsToUpdate = {};
    
    if (name !== undefined) {
      fieldsToUpdate.name = name;
    }

    if (email !== undefined) {
      fieldsToUpdate.email = email;
    }

    if (phone !== undefined) {
      profileFieldsToUpdate.phone = phone;
    }

    if (dob !== undefined) {
      profileFieldsToUpdate.dob = dob;
    }

    // Start a transaction to ensure data consistency
    const transaction = await db.sequelize.transaction();

    try {
      // Update main user data if there are changes
      if (Object.keys(fieldsToUpdate).length > 0) {
        // Check if email already exists (if email is being updated)
        if (fieldsToUpdate.email) {
          const existingUser = await User.findOne({
            where: { 
              email: fieldsToUpdate.email,
              id: { [db.Sequelize.Op.ne]: userId } // Exclude current user
            },
            transaction
          });
          
          if (existingUser) {
            await transaction.rollback();
            return res.status(409).json({
              success: false,
              message: 'Email already exists. Please use a different email address.'
            });
          }
        }

        await User.update(fieldsToUpdate, {
          where: { id: userId },
          transaction
        });
      }

      // Update or create user profile if there are profile changes
      if (Object.keys(profileFieldsToUpdate).length > 0) {
        // Get existing profile first
        const existingProfile = await UserProfile.findOne({
          where: { user_id: userId },
          transaction
        });

        if (existingProfile) {
          // Update existing profile with only the provided fields
          await UserProfile.update(profileFieldsToUpdate, {
            where: { user_id: userId },
            transaction
          });
        } else {
          // Create new profile with user_id and provided fields
          await UserProfile.create({
            user_id: userId,
            ...profileFieldsToUpdate
          }, { transaction });
        }
      }

      // Handle addresses update if provided
      if (addresses !== undefined) {
        // Delete existing addresses
        await Address.destroy({
          where: { user_id: userId },
          transaction
        });

        // Create new addresses if provided
        if (addresses && addresses.length > 0) {
          const addressPromises = addresses.map(address => {
            return Address.create({
              user_id: userId,
              street: address.street || null,
              city: address.city || null,
              state: address.state || null,
              zip_code: address.zip_code || null,
              country: address.country || null,
              type: address.type || 'home'
            }, { transaction });
          });

          await Promise.all(addressPromises);
        }
      }

      // Handle temp_addresses update if provided
      if (temp_addresses !== undefined) {
        // Delete existing temp addresses
        await TempAddress.destroy({
          where: { user_id: userId },
          transaction
        });

        // Create new temp addresses if provided
        if (temp_addresses && temp_addresses.length > 0) {
          const tempAddressPromises = temp_addresses.map(tempAddress => {
            return TempAddress.create({
              user_id: userId,
              location_data: tempAddress.location_data || '',
              pincode: tempAddress.pincode || '',
              selected_area: tempAddress.selected_area || '',
              city: tempAddress.city || null,
              state: tempAddress.state || null,
              country: tempAddress.country || 'India',
              location_permission: tempAddress.location_permission || false,
              is_active: tempAddress.is_active !== undefined ? tempAddress.is_active : true,
              expires_at: tempAddress.expires_at ? new Date(tempAddress.expires_at) : null
            }, { transaction });
          });

          await Promise.all(tempAddressPromises);
        }
      }

      await transaction.commit();

      // Fetch updated profile with all related data
      const updatedUser = await User.findByPk(userId, {
        include: [
          {
            model: UserProfile,
            as: 'profile',
            attributes: ['id', 'phone', 'dob', 'gender', 'created_at', 'updated_at']
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
          }
        ],
        attributes: ['id', 'name', 'email', 'created_at', 'updated_at']
      });

      const profileData = {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        created_at: updatedUser.created_at,
        updated_at: updatedUser.updated_at,
        profile: updatedUser.profile || null,
        addresses: updatedUser.addresses || [],
        temp_addresses: updatedUser.tempAddresses || []
      };

      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: profileData
      });

    } catch (error) {
      await transaction.rollback();
      throw error;
    }

  } catch (error) {
    // Handle unique constraint errors for email
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({
        success: false,
        message: 'Email already exists. Please use a different email address.'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
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
          attributes: ['gender'] // Only gender from personal profile for privacy
        },
        {
          model: WorkProfile,
          as: 'workProfiles',
          attributes: ['company_name', 'designation', 'start_date', 'end_date'],
          order: [['start_date', 'DESC']] // Most recent work experience first
        }
      ],
      attributes: ['id', 'name', 'created_at'] // Limited user data - no email
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Transform the data for public profile
    const publicProfileData = {
      id: user.id,
      name: user.name,
      member_since: user.created_at,
      profile: {
        gender: user.profile?.gender || null
      },
      work_experience: user.workProfiles.map(work => ({
        company_name: work.company_name,
        designation: work.designation,
        start_date: work.start_date,
        end_date: work.end_date,
        duration: calculateWorkDuration(work.start_date, work.end_date)
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