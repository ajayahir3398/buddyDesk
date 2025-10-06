const db = require("../models");
const Feedback = db.Feedback;

// Create new feedback
exports.createFeedback = async (req, res) => {
  try {
    const userId = req.user.id;
    const { type, subject, message, rating } = req.body;

    // Create feedback
    const feedback = await Feedback.create({
      user_id: userId,
      type: type || 'general',
      subject,
      message,
      rating: rating || null
    });

    res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully',
      data: {
        id: feedback.id,
        created_at: feedback.created_at
      }
    });

  } catch (error) {
    console.error("Create feedback error:", error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

