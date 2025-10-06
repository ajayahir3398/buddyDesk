const db = require("../models");
const FeedPost = db.FeedPost;
const FeedAttachment = db.FeedAttachment;
const FeedLike = db.FeedLike;
const FeedComment = db.FeedComment;
const FeedShare = db.FeedShare;
const FeedView = db.FeedView;
const User = db.User;
const UserProfile = db.UserProfile;
const Skill = db.Skill;
const SubSkill = db.SubSkill;
const { getFileUrl, getFileCategoryFromPath } = require("../middlewares/upload");
const { sendFeedPostNotificationToAllUsers } = require("../services/notificationService");
const logger = require("../utils/logger");

// Helper function to calculate engagement score
const calculateEngagementScore = (post) => {
  const now = new Date();
  const postAge = (now - new Date(post.created_at)) / (1000 * 60 * 60 * 24); // days
  
  // Base score from engagement
  const baseScore = (post.like_count * 1) + (post.comment_count * 3) + (post.share_count * 5) + (post.view_count * 0.1);
  
  // Time decay factor (newer posts get higher scores)
  const timeDecay = Math.exp(-postAge / 7); // Decay over 7 days
  
  // Bonus for featured posts
  const featuredBonus = post.is_featured ? 50 : 0;
  
  return Math.round((baseScore * timeDecay + featuredBonus) * 100) / 100;
};

// Helper function to generate attachment URLs (same as posts controller)
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

// Helper function to generate feed URLs
const generateFeedUrls = (posts, baseUrl) => {
  return posts.map(post => {
    const postData = post.toJSON ? post.toJSON() : post;
    
    // Generate URLs for attachments using the same function as posts
    if (postData.attachments && postData.attachments.length > 0) {
      postData.attachments = generateAttachmentUrls(postData.attachments, baseUrl);
    }
    
    // Generate user profile image URL
    if (postData.user && postData.user.profile && postData.user.profile.image_path) {
      postData.user.profile.image_url = `${baseUrl}/api/files/${postData.user.profile.image_path}`;
    }
    
    return postData;
  });
};

// Helper function to generate comment URLs
const generateCommentUrls = (comments, baseUrl) => {
  return comments.map(comment => {
    const commentData = comment.toJSON ? comment.toJSON() : comment;
    
    // Generate user profile image URL for main comment
    if (commentData.user && commentData.user.profile && commentData.user.profile.image_path) {
      commentData.user.profile.image_url = `${baseUrl}/api/files/${commentData.user.profile.image_path}`;
    }
    
    // Generate user profile image URLs for replies
    if (commentData.replies && commentData.replies.length > 0) {
      commentData.replies = commentData.replies.map(reply => {
        const replyData = reply.toJSON ? reply.toJSON() : reply;
        if (replyData.user && replyData.user.profile && replyData.user.profile.image_path) {
          replyData.user.profile.image_url = `${baseUrl}/api/files/${replyData.user.profile.image_path}`;
        }
        return replyData;
      });
    }
    
    return commentData;
  });
};

// Create a new feed post
exports.createFeedPost = async (req, res) => {
  try {
    const userId = req.user.id;
    const { content } = req.body;

    // Validate required fields
    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Content is required'
      });
    }

    // Create the feed post
    const feedPost = await FeedPost.create({
      user_id: userId,
      content: content.trim()
    });

    // Handle file attachments if any
    if (req.files && req.files.length > 0) {
      const attachments = req.files.map(file => ({
        feed_post_id: feedPost.id,
        file_path: getFileUrl(file.path), // Use same function as posts controller
        file_name: file.originalname,
        file_type: file.mimetype.startsWith('image/') ? 'image' : 
                   file.mimetype.startsWith('video/') ? 'video' : 
                   file.mimetype.startsWith('audio/') ? 'audio' : 'document',
        mime_type: file.mimetype,
        file_size: file.size
      }));

      await FeedAttachment.bulkCreate(attachments);
    }

    // Fetch the complete post with associations
    const completePost = await FeedPost.findByPk(feedPost.id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email'],
          include: [{
            model: UserProfile,
            as: 'profile',
            attributes: ['image_path', 'bio']
          }]
        },
        {
          model: FeedAttachment,
          as: 'attachments',
          attributes: ['id', 'file_path', 'file_name', 'file_type', 'mime_type', 'file_size', 'thumbnail_path', 'width', 'height']
        }
      ]
    });

    // Generate URLs
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const postWithUrls = generateFeedUrls([completePost], baseUrl)[0];

    // Send notifications to all users (excluding post creator)
    // This is done asynchronously to not block the response
    sendFeedPostNotificationToAllUsers(completePost).catch(error => {
      logger.error('Failed to send feed post notifications', {
        requestId: req.requestId,
        feedPostId: completePost.id,
        error: error.message
      });
    });

    res.status(201).json({
      success: true,
      message: 'Feed post created successfully',
      data: postWithUrls
    });

  } catch (error) {
    console.error('Create feed post error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get personalized feed
exports.getFeed = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;



    // Build where conditions
    let whereConditions = {
      status: 'active'
    };

    // Get all posts (prioritizing featured and trending)
    let feedPosts = [];
    const allPosts = await FeedPost.findAll({
      where: {
        ...whereConditions,
        user_id: { [db.Sequelize.Op.ne]: userId } // Exclude own posts
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email'],
          include: [{
            model: UserProfile,
            as: 'profile',
            attributes: ['image_path', 'bio']
          }]
        },
        {
          model: FeedAttachment,
          as: 'attachments',
          attributes: ['id', 'file_path', 'file_name', 'file_type', 'mime_type', 'file_size', 'thumbnail_path', 'width', 'height']
        },
        {
          model: FeedLike,
          as: 'likes',
          where: { user_id: userId },
          required: false,
          attributes: ['id', 'like_type']
        }
      ],
      order: [
        ['is_featured', 'DESC'], // Featured posts first
        ['engagement_score', 'DESC'], // Then by engagement score
        ['created_at', 'DESC'] // Then by newest
      ],
      limit: limit
    });
    feedPosts = [...feedPosts, ...allPosts];

    // Remove duplicates and sort by engagement score
    const uniquePosts = feedPosts.filter((post, index, self) => 
      index === self.findIndex(p => p.id === post.id)
    );

    // Calculate engagement scores and sort
    uniquePosts.forEach(post => {
      post.engagement_score = calculateEngagementScore(post);
    });

    uniquePosts.sort((a, b) => b.engagement_score - a.engagement_score);

    // Apply pagination
    const paginatedPosts = uniquePosts.slice(offset, offset + parseInt(limit));

    // Generate URLs
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const postsWithUrls = generateFeedUrls(paginatedPosts, baseUrl);

    res.status(200).json({
      success: true,
      message: 'Feed retrieved successfully',
      data: {
        posts: postsWithUrls,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: uniquePosts.length,
          hasMore: (offset + parseInt(limit)) < uniquePosts.length
        }
      }
    });

  } catch (error) {
    console.error('Get feed error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get specific feed post
exports.getFeedPost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const feedPost = await FeedPost.findOne({
      where: { id, status: 'active' },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email'],
          include: [{
            model: UserProfile,
            as: 'profile',
            attributes: ['image_path', 'bio']
          }]
        },
        {
          model: FeedAttachment,
          as: 'attachments',
          attributes: ['id', 'file_path', 'file_name', 'file_type', 'mime_type', 'file_size', 'thumbnail_path', 'width', 'height']
        },
        {
          model: FeedLike,
          as: 'likes',
          where: { user_id: userId },
          required: false,
          attributes: ['id', 'like_type']
        }
      ]
    });

    if (!feedPost) {
      return res.status(404).json({
        success: false,
        message: 'Feed post not found'
      });
    }

    // Track view
    await FeedView.create({
      feed_post_id: id,
      user_id: userId,
      device_type: req.get('User-Agent')?.includes('Mobile') ? 'mobile' : 'desktop'
    });

    // Update view count
    await FeedPost.increment('view_count', { where: { id } });

    // Generate URLs
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const postWithUrls = generateFeedUrls([feedPost], baseUrl)[0];

    res.status(200).json({
      success: true,
      message: 'Feed post retrieved successfully',
      data: postWithUrls
    });

  } catch (error) {
    console.error('Get feed post error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Like/Unlike a feed post
exports.toggleLike = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { like_type = 'like' } = req.body;

    // Check if post exists
    const feedPost = await FeedPost.findByPk(id);
    if (!feedPost) {
      return res.status(404).json({
        success: false,
        message: 'Feed post not found'
      });
    }

    // Check if user already liked this post
    const existingLike = await FeedLike.findOne({
      where: { feed_post_id: id, user_id: userId }
    });

    if (existingLike) {
      // Unlike the post
      await existingLike.destroy();
      await FeedPost.decrement('like_count', { where: { id } });
      
      res.status(200).json({
        success: true,
        message: 'Post unliked successfully',
        data: { liked: false }
      });
    } else {
      // Like the post
      await FeedLike.create({
        feed_post_id: id,
        user_id: userId,
        like_type
      });
      await FeedPost.increment('like_count', { where: { id } });
      
      res.status(200).json({
        success: true,
        message: 'Post liked successfully',
        data: { liked: true, like_type }
      });
    }

  } catch (error) {
    console.error('Toggle like error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Add comment to feed post
exports.addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { content, parent_comment_id } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Comment content is required'
      });
    }

    // Check if post exists
    const feedPost = await FeedPost.findByPk(id);
    if (!feedPost) {
      return res.status(404).json({
        success: false,
        message: 'Feed post not found'
      });
    }

    // Create comment
    const comment = await FeedComment.create({
      feed_post_id: id,
      user_id: userId,
      parent_comment_id: parent_comment_id || null,
      content: content.trim()
    });

    // Update comment count
    await FeedPost.increment('comment_count', { where: { id } });

    // If it's a reply, update parent comment's reply count
    if (parent_comment_id) {
      await FeedComment.increment('reply_count', { where: { id: parent_comment_id } });
    }

    // Fetch complete comment with user info
    const completeComment = await FeedComment.findByPk(comment.id, {
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'email'],
        include: [{
          model: UserProfile,
          as: 'profile',
          attributes: ['image_path']
        }]
      }]
    });

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      data: completeComment
    });

  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get comments for a feed post
exports.getComments = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const comments = await FeedComment.findAndCountAll({
      where: { 
        feed_post_id: id, 
        parent_comment_id: null, // Only top-level comments
        status: 'active' 
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email'],
          include: [{
            model: UserProfile,
            as: 'profile',
            attributes: ['image_path']
          }]
        },
        {
          model: FeedComment,
          as: 'replies',
          limit: 3, // Limit replies per comment
          include: [{
            model: User,
            as: 'user',
            attributes: ['id', 'name', 'email'],
            include: [{
              model: UserProfile,
              as: 'profile',
              attributes: ['image_path']
            }]
          }]
        }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: offset
    });

    // Generate URLs for comments
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const commentsWithUrls = generateCommentUrls(comments.rows, baseUrl);

    res.status(200).json({
      success: true,
      message: 'Comments retrieved successfully',
      data: {
        comments: commentsWithUrls,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: comments.count,
          hasMore: (offset + parseInt(limit)) < comments.count
        }
      }
    });

  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Share a feed post
exports.sharePost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { share_type, quote_text } = req.body;

    // Check if post exists
    const feedPost = await FeedPost.findByPk(id);
    if (!feedPost) {
      return res.status(404).json({
        success: false,
        message: 'Feed post not found'
      });
    }

    // Create share record
    await FeedShare.create({
      feed_post_id: id,
      user_id: userId,
      share_type: share_type || 'repost',
      quote_text: quote_text || null
    });

    // Update share count
    await FeedPost.increment('share_count', { where: { id } });

    res.status(201).json({
      success: true,
      message: 'Post shared successfully',
      data: { share_type: share_type || 'repost' }
    });

  } catch (error) {
    console.error('Share post error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};


// Get trending posts
exports.getTrendingPosts = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const trendingPosts = await FeedPost.findAll({
      where: {
        status: 'active'
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email'],
          include: [{
            model: UserProfile,
            as: 'profile',
            attributes: ['image_path', 'bio']
          }]
        },
        {
          model: FeedAttachment,
          as: 'attachments',
          attributes: ['id', 'file_path', 'file_name', 'file_type', 'mime_type', 'file_size', 'thumbnail_path', 'width', 'height']
        },
        {
          model: FeedLike,
          as: 'likes',
          where: { user_id: userId },
          required: false,
          attributes: ['id', 'like_type']
        }
      ],
      order: [
        ['is_featured', 'DESC'], // Featured posts first
        ['engagement_score', 'DESC'], // Then by engagement score
        ['created_at', 'DESC'] // Then by newest
      ],
      limit: parseInt(limit),
      offset: offset
    });

    // Generate URLs
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const postsWithUrls = generateFeedUrls(trendingPosts, baseUrl);

    res.status(200).json({
      success: true,
      message: 'Trending posts retrieved successfully',
      data: {
        posts: postsWithUrls,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          hasMore: trendingPosts.length === parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Get trending posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get logged-in user's own feed posts
exports.getUserFeedPosts = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const userPosts = await FeedPost.findAndCountAll({
      where: { 
        user_id: userId,
        status: 'active'
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email'],
          include: [{
            model: UserProfile,
            as: 'profile',
            attributes: ['image_path', 'bio']
          }]
        },
        {
          model: FeedAttachment,
          as: 'attachments',
          attributes: ['id', 'file_path', 'file_name', 'file_type', 'mime_type', 'file_size', 'thumbnail_path', 'width', 'height']
        },
        {
          model: FeedLike,
          as: 'likes',
          where: { user_id: userId },
          required: false,
          attributes: ['id', 'like_type']
        }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: offset
    });

    // Generate URLs
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const postsWithUrls = generateFeedUrls(userPosts.rows, baseUrl);

    res.status(200).json({
      success: true,
      message: 'User feed posts retrieved successfully',
      data: {
        posts: postsWithUrls,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: userPosts.count,
          hasMore: (offset + parseInt(limit)) < userPosts.count
        }
      }
    });

  } catch (error) {
    console.error('Get user feed posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Delete feed post
exports.deleteFeedPost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const feedPost = await FeedPost.findOne({
      where: { id, user_id: userId }
    });

    if (!feedPost) {
      return res.status(404).json({
        success: false,
        message: 'Feed post not found or access denied'
      });
    }

    // Soft delete
    await feedPost.update({ status: 'deleted' });

    res.status(200).json({
      success: true,
      message: 'Feed post deleted successfully'
    });

  } catch (error) {
    console.error('Delete feed post error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};
