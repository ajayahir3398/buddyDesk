const db = require("../models");
const Post = db.Post;
const User = db.User;
const Skill = db.Skill;
const SubSkill = db.SubSkill;
const PostAttachment = db.PostAttachment;
const WorkProfile = db.WorkProfile;
const UserSkill = db.UserSkill;
const Address = db.Address;
const logger = require('../utils/logger');
const { deleteFile, getFileUrl, getFileCategoryFromPath, validateFileAccess } = require('../middlewares/upload');
const path = require('path');
const { Op } = require('sequelize');
const fs = require('fs'); // Added for enhanced file serving

// Helper function to generate full attachment URLs
const generateAttachmentUrls = (attachments, baseUrl) => {
  if (!attachments || attachments.length === 0) return [];
  
  return attachments.map(attachment => {
    // Handle both Sequelize instances and plain objects 
    const attachmentData = attachment.toJSON ? attachment.toJSON() : attachment;
    
    return {
      ...attachmentData,
      url: `${baseUrl}/api/posts/files/${attachmentData.file_path}`,
      // Keep original file_path for backward compatibility
      file_path: attachmentData.file_path
    };
  });
};

// Create a new post
exports.addPost = async (req, res) => {
  try {
    const {
      title,
      description,
      required_skill_id,
      required_sub_skill_id,
      medium,
      deadline
    } = req.body;

    // Get user ID from authenticated token
    const user_id = req.user.id;

    // Validate that the user exists
    const user = await User.findByPk(user_id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Validate skill if provided
    if (required_skill_id) {
      const skill = await Skill.findByPk(required_skill_id);
      if (!skill) {
        return res.status(400).json({
          success: false,
          message: "Invalid skill ID provided"
        });
      }
    }

    // Validate sub-skill if provided
    if (required_sub_skill_id) {
      const subSkill = await SubSkill.findByPk(required_sub_skill_id);
      if (!subSkill) {
        return res.status(400).json({
          success: false,
          message: "Invalid sub-skill ID provided"
        });
      }
    }

    // Create the post
    const post = await Post.create({
      user_id,
      title,
      description,
      required_skill_id: required_skill_id || null,
      required_sub_skill_id: required_sub_skill_id || null,
      medium: medium || 'online',
      deadline: deadline || null,
      status: 'active'
    });

    // Handle file attachments if uploaded
    if (req.files && req.files.length > 0) {
      const attachmentPromises = req.files.map(file => {
        // Determine file category based on the file path
        const fileCategory = getFileCategoryFromPath(file.path);
        
        return PostAttachment.create({
          post_id: post.id,
          file_name: file.originalname,
          file_path: getFileUrl(file.path),
          file_category: fileCategory,
          mime_type: file.mimetype,
          size: file.size,
          uploaded_at: new Date()
        });
      });

      try {
        await Promise.all(attachmentPromises);
        logger.info(`${req.files.length} attachments uploaded for post`, {
          requestId: req.requestId,
          postId: post.id,
          files: req.files.map(f => ({ 
            originalname: f.originalname, 
            category: getFileCategoryFromPath(f.path),
            size: f.size 
          }))
        });
      } catch (attachmentError) {
        // If attachment creation fails, delete uploaded files
        req.files.forEach(file => {
          deleteFile(file.path);
        });
        throw new Error('Failed to save file attachments');
      }
    }

    // Fetch the created post with associations
    const createdPost = await Post.findByPk(post.id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email']
        },
        {
          model: Skill,
          as: 'requiredSkill',
          attributes: ['id', 'name']
        },
        {
          model: SubSkill,
          as: 'requiredSubSkill',
          attributes: ['id', 'name']
        },
        {
          model: PostAttachment,
          as: 'attachments',
          attributes: ['id', 'file_name', 'file_path', 'file_category', 'mime_type', 'size', 'uploaded_at'],
          order: [['uploaded_at', 'ASC']]
        }
      ]
    });

    logger.info(`Post created successfully`, {
      requestId: req.requestId,
      userId: user_id,
      postId: post.id
    });

    res.status(201).json({
      success: true,
      message: "Post created successfully",
      data: createdPost
    });

  } catch (error) {
    logger.error('Error creating post', {
      requestId: req.requestId,
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get all posts (with pagination and filtering)
exports.getPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const { status, medium, skill_id } = req.query;

    // Build where clause for filtering
    const where = {};
    if (status) where.status = status;
    if (medium) where.medium = medium;
    if (skill_id) where.required_skill_id = skill_id;

    const { count, rows: posts } = await Post.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email']
        },
        {
          model: Skill,
          as: 'requiredSkill',
          attributes: ['id', 'name']
        },
        {
          model: SubSkill,
          as: 'requiredSubSkill',
          attributes: ['id', 'name']
        },
        {
          model: PostAttachment,
          as: 'attachments',
          attributes: ['id', 'file_name', 'file_path', 'file_category', 'mime_type', 'size', 'uploaded_at'],
          order: [['uploaded_at', 'ASC']]
        }
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset
    });

    // Generate full URLs for attachments AFTER all Sequelize processing
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    
    // Convert to plain objects and add URLs
    const postsWithUrls = posts.map(post => {
      const postData = post.toJSON ? post.toJSON() : post;
      
      if (postData.attachments && postData.attachments.length > 0) {
        postData.attachments = generateAttachmentUrls(postData.attachments, baseUrl);
      }
      
      return postData;
    });

    res.status(200).json({
      success: true,
      message: "Posts retrieved successfully",
      data: postsWithUrls,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(count / limit),
        totalItems: count,
        itemsPerPage: limit
      }
    });

  } catch (error) {
    logger.error('Error retrieving posts', {
      requestId: req.requestId,
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get matching posts for logged-in user
exports.getMatchingPosts = async (req, res) => {
  try {
    const user_id = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const { 
      status, 
      medium, 
      min_match_score,
      match_skills,
      match_sub_skills,
      match_location
    } = req.query;

    // Parse matching criteria from query params (default: all true if none specified)
    const shouldMatchSkills = match_skills !== undefined ? match_skills === 'true' : true;
    const shouldMatchSubSkills = match_sub_skills !== undefined ? match_sub_skills === 'true' : true;
    const shouldMatchLocation = match_location !== undefined ? match_location === 'true' : true;

    // Validate that at least one matching criterion is enabled
    if (!shouldMatchSkills && !shouldMatchSubSkills && !shouldMatchLocation) {
      return res.status(400).json({
        success: false,
        message: "At least one matching criterion must be enabled (skills, sub_skills, or location)"
      });
    }

    // Get user's skills from their work profiles (only if skill matching is enabled)
    let userSkills = [];
    if (shouldMatchSkills || shouldMatchSubSkills) {
      userSkills = await UserSkill.findAll({
        include: [{
          model: WorkProfile,
          as: 'workProfile',
          where: { user_id },
          attributes: []
        }],
        attributes: ['skill_id', 'sub_skill_id']
      });
    }

    // Get user's zip codes from their addresses (only if location matching is enabled)
    let userAddresses = [];
    if (shouldMatchLocation) {
      userAddresses = await Address.findAll({
        where: { user_id },
        attributes: ['zip_code']
      });
    }

    // Check if user has the required data for enabled matching criteria
    const missingCriteria = [];
    if (shouldMatchSkills && userSkills.length === 0) {
      missingCriteria.push("skills");
    }
    if (shouldMatchSubSkills && userSkills.length === 0) {
      missingCriteria.push("sub-skills");
    }
    if (shouldMatchLocation && userAddresses.length === 0) {
      missingCriteria.push("address");
    }

    if (missingCriteria.length > 0) {
      return res.status(200).json({
        success: true,
        message: `No matching posts found - please complete your profile with: ${missingCriteria.join(', ')}`,
        data: [],
        pagination: {
          currentPage: page,
          totalPages: 0,
          totalItems: 0,
          itemsPerPage: limit
        },
        enabledCriteria: {
          skills: shouldMatchSkills,
          subSkills: shouldMatchSubSkills,
          location: shouldMatchLocation
        }
      });
    }

    // Extract skill IDs and sub-skill IDs
    const userSkillIds = [...new Set(userSkills.map(us => us.skill_id))];
    const userSubSkillIds = [...new Set(userSkills.map(us => us.sub_skill_id).filter(id => id !== null))];
    const userZipCodes = [...new Set(userAddresses.map(addr => addr.zip_code).filter(zip => zip !== null))];

    // Build matching conditions based on enabled criteria
    const matchingConditions = [];

    // Skill matching (only if enabled and user has skills)
    if (shouldMatchSkills && userSkillIds.length > 0) {
      matchingConditions.push({
        required_skill_id: {
          [Op.in]: userSkillIds
        }
      });
    }

    // Sub-skill matching (only if enabled and user has sub-skills)
    if (shouldMatchSubSkills && userSubSkillIds.length > 0) {
      matchingConditions.push({
        required_sub_skill_id: {
          [Op.in]: userSubSkillIds
        }
      });
    }

    // Location matching (only if enabled and user has zip codes)
    if (shouldMatchLocation && userZipCodes.length > 0) {
      matchingConditions.push({
        '$user.addresses.zip_code$': {
          [Op.in]: userZipCodes
        }
      });
    }

    if (matchingConditions.length === 0) {
      const enabledButMissingData = [];
      if (shouldMatchSkills && userSkillIds.length === 0) enabledButMissingData.push("skills");
      if (shouldMatchSubSkills && userSubSkillIds.length === 0) enabledButMissingData.push("sub-skills");
      if (shouldMatchLocation && userZipCodes.length === 0) enabledButMissingData.push("location data");

      return res.status(200).json({
        success: true,
        message: `No matching criteria available. Missing data for enabled criteria: ${enabledButMissingData.join(', ')}`,
        data: [],
        pagination: {
          currentPage: page,
          totalPages: 0,
          totalItems: 0,
          itemsPerPage: limit
        },
        enabledCriteria: {
          skills: shouldMatchSkills,
          subSkills: shouldMatchSubSkills,
          location: shouldMatchLocation
        }
      });
    }

    // Build where clause for additional filters
    const additionalFilters = {
      user_id: { [Op.ne]: user_id }, // Exclude user's own posts
      status: status || 'active' // Default to active posts
    };

    if (medium) additionalFilters.medium = medium;

    // Main query to find matching posts
    const { count, rows: posts } = await Post.findAndCountAll({
      where: {
        [Op.and]: [
          additionalFilters,
          {
            [Op.or]: matchingConditions
          }
        ]
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email'],
          include: [{
            model: Address,
            as: 'addresses',
            attributes: ['zip_code', 'city', 'state'],
            required: false
          }]
        },
        {
          model: Skill,
          as: 'requiredSkill',
          attributes: ['id', 'name']
        },
        {
          model: SubSkill,
          as: 'requiredSubSkill',
          attributes: ['id', 'name']
        },
        {
          model: PostAttachment,
          as: 'attachments',
          where: { is_deleted: false },
          attributes: ['id', 'file_name', 'file_path', 'file_category', 'mime_type', 'size', 'uploaded_at'],
          order: [['uploaded_at', 'ASC']],
          required: false
        }
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset,
      distinct: true
    });

    // Calculate match scores for each post based on enabled criteria
    const postsWithMatchScore = posts.map(post => {
      let matchScore = 0;
      let maxScore = 0;
      const reasons = {};

      // Skill match scoring (only if enabled)
      if (shouldMatchSkills) {
        const skillMatches = post.required_skill_id && userSkillIds.includes(post.required_skill_id);
        if (skillMatches) {
          matchScore += 3;
        }
        if (post.required_skill_id) maxScore += 3;
        reasons.skillMatch = skillMatches;
      }

      // Sub-skill match scoring (only if enabled)
      if (shouldMatchSubSkills) {
        const subSkillMatches = post.required_sub_skill_id && userSubSkillIds.includes(post.required_sub_skill_id);
        if (subSkillMatches) {
          matchScore += 2;
        }
        if (post.required_sub_skill_id) maxScore += 2;
        reasons.subSkillMatch = subSkillMatches;
      }

      // Location match scoring (only if enabled)
      if (shouldMatchLocation) {
        const postUserZipCodes = post.user.addresses?.map(addr => addr.zip_code) || [];
        const hasLocationMatch = postUserZipCodes.some(zip => userZipCodes.includes(zip));
        if (hasLocationMatch) {
          matchScore += 1;
        }
        if (postUserZipCodes.length > 0) maxScore += 1;
        reasons.locationMatch = hasLocationMatch;
      }

      const matchPercentage = maxScore > 0 ? Math.round((matchScore / maxScore) * 100) : 0;

      return {
        ...post.toJSON(),
        matchScore: {
          score: matchScore,
          maxScore: maxScore,
          percentage: matchPercentage,
          reasons,
          enabledCriteria: {
            skills: shouldMatchSkills,
            subSkills: shouldMatchSubSkills,
            location: shouldMatchLocation
          }
        }
      };
    });

    // Filter by minimum match score if specified
    let filteredPosts = postsWithMatchScore;
    if (min_match_score) {
      const minScore = parseInt(min_match_score);
      filteredPosts = postsWithMatchScore.filter(post => post.matchScore.percentage >= minScore);
    }

    // Sort by match score (highest first)
    filteredPosts.sort((a, b) => b.matchScore.percentage - a.matchScore.percentage);

    // Generate full URLs for attachments AFTER all Sequelize processing
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    
    // Convert to plain objects and add URLs
    const postsWithUrls = filteredPosts.map(post => {
      const postData = post.toJSON ? post.toJSON() : post;
      
      if (postData.attachments && postData.attachments.length > 0) {
        postData.attachments = generateAttachmentUrls(postData.attachments, baseUrl);
      }
      
      return postData;
    });

    logger.info('Matching posts retrieved', {
      requestId: req.requestId,
      userId: user_id,
      totalPosts: count,
      filteredCount: filteredPosts.length,
      enabledCriteria: { skills: shouldMatchSkills, subSkills: shouldMatchSubSkills, location: shouldMatchLocation },
      userSkillIds: shouldMatchSkills ? userSkillIds.length : 'disabled',
      userSubSkillIds: shouldMatchSubSkills ? userSubSkillIds.length : 'disabled',
      userZipCodes: shouldMatchLocation ? userZipCodes.length : 'disabled'
    });

    res.status(200).json({
      success: true,
      message: "Matching posts retrieved successfully",
      data: postsWithUrls,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(count / limit),
        totalItems: count,
        itemsPerPage: limit
      },
      matchingCriteria: {
        enabled: {
          skills: shouldMatchSkills,
          subSkills: shouldMatchSubSkills,
          location: shouldMatchLocation
        },
        userDataCounts: {
          skills: shouldMatchSkills ? userSkillIds.length : null,
          subSkills: shouldMatchSubSkills ? userSubSkillIds.length : null,
          locations: shouldMatchLocation ? userZipCodes.length : null
        }
      }
    });

  } catch (error) {
    logger.error('Error retrieving matching posts', {
      requestId: req.requestId,
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get post by ID
exports.getPostById = async (req, res) => {
  try {
    const { id } = req.params;

    const post = await Post.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email']
        },
        {
          model: Skill,
          as: 'requiredSkill',
          attributes: ['id', 'name']
        },
        {
          model: SubSkill,
          as: 'requiredSubSkill',
          attributes: ['id', 'name']
        },
        {
          model: PostAttachment,
          as: 'attachments',
          attributes: ['id', 'file_name', 'file_path', 'file_category', 'mime_type', 'size', 'uploaded_at'],
          order: [['uploaded_at', 'ASC']]
        }
      ]
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found"
      });
    }

    // Generate full URLs for attachments AFTER all Sequelize processing
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    
    // Convert to plain object and add URLs
    const postWithUrls = post.toJSON ? post.toJSON() : post;
    
    if (postWithUrls.attachments && postWithUrls.attachments.length > 0) {
      postWithUrls.attachments = generateAttachmentUrls(postWithUrls.attachments, baseUrl);
    }

    res.status(200).json({
      success: true,
      message: "Post retrieved successfully",
      data: postWithUrls
    });

  } catch (error) {
    logger.error('Error retrieving post', {
      requestId: req.requestId,
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update existing post
exports.updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;
    const {
      title,
      description,
      required_skill_id,
      required_sub_skill_id,
      medium,
      status,
      deadline
    } = req.body;

    // Find the post and check ownership
    const post = await Post.findOne({
      where: { id, user_id }
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found or you don't have permission to update it"
      });
    }

    // Validate skill if provided
    if (required_skill_id) {
      const skill = await Skill.findByPk(required_skill_id);
      if (!skill) {
        return res.status(400).json({
          success: false,
          message: "Invalid skill ID provided"
        });
      }
    }

    // Validate sub-skill if provided
    if (required_sub_skill_id) {
      const subSkill = await SubSkill.findByPk(required_sub_skill_id);
      if (!subSkill) {
        return res.status(400).json({
          success: false,
          message: "Invalid sub-skill ID provided"
        });
      }
    }

    // Prepare update data (only include fields that are provided)
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (required_skill_id !== undefined) updateData.required_skill_id = required_skill_id || null;
    if (required_sub_skill_id !== undefined) updateData.required_sub_skill_id = required_sub_skill_id || null;
    if (medium !== undefined) updateData.medium = medium;
    if (status !== undefined) updateData.status = status;
    if (deadline !== undefined) updateData.deadline = deadline || null;

    // Update the post
    await post.update(updateData);

    // Fetch the updated post with associations
    const updatedPost = await Post.findByPk(post.id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email']
        },
        {
          model: Skill,
          as: 'requiredSkill',
          attributes: ['id', 'name']
        },
        {
          model: SubSkill,
          as: 'requiredSubSkill',
          attributes: ['id', 'name']
        },
        {
          model: PostAttachment,
          as: 'attachments',
          attributes: ['id', 'file_name', 'file_path', 'file_category', 'mime_type', 'size', 'uploaded_at'],
          order: [['uploaded_at', 'ASC']],
          required: false
        }
      ]
    });

    logger.info('Post updated successfully', {
      requestId: req.requestId,
      userId: user_id,
      postId: post.id,
      updatedFields: Object.keys(updateData)
    });

    // Generate full URLs for attachments AFTER all Sequelize processing
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    
    // Convert to plain object and add URLs
    const postWithUrls = updatedPost.toJSON ? updatedPost.toJSON() : updatedPost;
    
    if (postWithUrls.attachments && postWithUrls.attachments.length > 0) {
      postWithUrls.attachments = generateAttachmentUrls(postWithUrls.attachments, baseUrl);
    }

    res.status(200).json({
      success: true,
      message: "Post updated successfully",
      data: postWithUrls
    });

  } catch (error) {
    logger.error('Error updating post', {
      requestId: req.requestId,
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Add attachment to existing post
exports.addAttachment = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;

    // Check if post exists and belongs to user
    const post = await Post.findOne({
      where: { id, user_id }
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found or you don't have permission to modify it"
      });
    }

    // Check if files were uploaded
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No files uploaded"
      });
    }

    // Create attachments with file categories
    const attachmentPromises = req.files.map(file => {
      // Determine file category based on the file path
      const fileCategory = getFileCategoryFromPath(file.path);
      
      return PostAttachment.create({
        post_id: post.id,
        file_name: file.originalname,
        file_path: getFileUrl(file.path),
        file_category: fileCategory,
        mime_type: file.mimetype,
        size: file.size,
        uploaded_at: new Date()
      });
    });

    const attachments = await Promise.all(attachmentPromises);

    logger.info(`${req.files.length} attachments added to post`, {
      requestId: req.requestId,
      postId: post.id,
      files: req.files.map(f => ({ 
        originalname: f.originalname, 
        category: getFileCategoryFromPath(f.path),
        size: f.size 
      }))
    });

    res.status(201).json({
      success: true,
      message: "Attachments uploaded successfully",
      data: attachments
    });

  } catch (error) {
    // Clean up uploaded files if database operation fails
    if (req.files) {
      req.files.forEach(file => {
        deleteFile(file.path);
      });
    }

    logger.error('Error adding attachments', {
      requestId: req.requestId,
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Download attachment
exports.downloadAttachment = async (req, res) => {
  try {
    const { attachmentId } = req.params;

    const attachment = await PostAttachment.findByPk(attachmentId, {
      include: [{
        model: Post,
        as: 'post'
      }]
    });

    if (!attachment) {
      return res.status(404).json({
        success: false,
        message: "Attachment not found"
      });
    }

    if (attachment.is_deleted) {
      return res.status(404).json({
        success: false,
        message: "Attachment has been deleted"
      });
    }

    const filePath = path.join(__dirname, '../', attachment.file_path);

    // Check if file exists
    if (!require('fs').existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: "File not found on server"
      });
    }

    // Set appropriate headers
    res.setHeader('Content-Type', attachment.mime_type);
    res.setHeader('Content-Disposition', `attachment; filename="${attachment.file_name}"`);

    // Send file
    res.sendFile(filePath);

  } catch (error) {
    logger.error('Error downloading attachment', {
      requestId: req.requestId,
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Delete attachment
exports.deleteAttachment = async (req, res) => {
  try {
    const { attachmentId } = req.params;
    const user_id = req.user.id;

    const attachment = await PostAttachment.findByPk(attachmentId, {
      include: [{
        model: Post,
        as: 'post'
      }]
    });

    if (!attachment) {
      return res.status(404).json({
        success: false,
        message: "Attachment not found"
      });
    }

    // Check if user owns the post
    if (attachment.post.user_id !== user_id) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to delete this attachment"
      });
    }

    // Mark as deleted (soft delete)
    await attachment.update({ is_deleted: true });

    // Optionally delete the physical file
    const filePath = path.join(__dirname, '../', attachment.file_path);
    deleteFile(filePath);

    logger.info('Attachment deleted', {
      requestId: req.requestId,
      attachmentId: attachment.id,
      postId: attachment.post_id
    });

    res.status(200).json({
      success: true,
      message: "Attachment deleted successfully"
    });

  } catch (error) {
    logger.error('Error deleting attachment', {
      requestId: req.requestId,
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// New enhanced file serving function with category-based organization
exports.serveFileByCategory = async (req, res) => {
  try {
    const { category, filename } = req.params;
    
    // Ensure user is authenticated
    // if (!req.user || !req.user.id) {
    //   return res.status(401).json({
    //     success: false,
    //     message: 'Authentication required'
    //   });
    // }
    
    // const user_id = req.user.id;

    // Validate category
    const validCategories = ['images', 'audio', 'documents', 'posts'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid file category'
      });
    }

    // Security: prevent directory traversal by using only the filename
    const safeFilename = path.basename(filename);
    
    // Find the attachment to verify access permissions
    const attachment = await PostAttachment.findOne({
      where: {
        file_path: `${category}/${safeFilename}`,
        is_deleted: false
      },
      include: [{
        model: Post,
        as: 'post',
        attributes: ['id', 'user_id']
      }]
    });

    if (!attachment) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    // Check if user has access to this file (either owner of post or has permission)
    // if (attachment.post.user_id !== user_id) {
    //   return res.status(403).json({
    //     success: false,
    //     message: 'Access denied to this file'
    //   });
    // }

    // Construct full file path
    const filePath = path.join(__dirname, '..', 'uploads', category, safeFilename);
    
    // Validate file access (security check)
    if (!validateFileAccess(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File not accessible'
      });
    }

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found on disk'
      });
    }

    // Set appropriate headers based on file type
    const mimeType = attachment.mime_type || 'application/octet-stream';
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${attachment.file_name}"`);
    
    // Add cache headers for better performance
    res.setHeader('Cache-Control', 'public, max-age=3600'); // 1 hour cache
    
    // Handle audio files with Range support for streaming
    if (category === 'audio' && mimeType.startsWith('audio/')) {
      const stat = fs.statSync(filePath);
      const range = req.headers.range;
      
      if (range) {
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
        const chunkSize = end - start + 1;
        
        res.status(206);
        res.setHeader('Content-Range', `bytes ${start}-${end}/${stat.size}`);
        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Content-Length', chunkSize);
        
        const stream = fs.createReadStream(filePath, { start, end });
        stream.pipe(res);
      } else {
        res.setHeader('Content-Length', stat.size);
        res.setHeader('Accept-Ranges', 'bytes');
        const stream = fs.createReadStream(filePath);
        stream.pipe(res);
      }
    } else {
      // For non-audio files, serve normally
      const stream = fs.createReadStream(filePath);
      stream.pipe(res);
    }

    logger.info('File served successfully', {
      requestId: req.requestId,
      category,
      filename: safeFilename,
      mimeType
    });

  } catch (error) {
    logger.error('Error serving file', {
      requestId: req.requestId,
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  addPost: exports.addPost,
  getPosts: exports.getPosts,
  getMatchingPosts: exports.getMatchingPosts,
  getPostById: exports.getPostById,
  updatePost: exports.updatePost,
  addAttachment: exports.addAttachment,
  downloadAttachment: exports.downloadAttachment,
  deleteAttachment: exports.deleteAttachment,
  serveFileByCategory: exports.serveFileByCategory
};