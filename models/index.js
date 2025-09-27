const Sequelize = require("sequelize");
const dbConfig = require("../config/db.config");

const sequelize = new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, {
    host: dbConfig.HOST,
    dialect: dbConfig.DIALECT,
    port: dbConfig.PORT,
    logging: process.env.NODE_ENV === 'development' ? false : false, // Disable SQL query logs
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false
        }
    },
    pool: {
        max: 5,
        min: 0,
        acquire: 60000,
        idle: 10000
    },
    retry: {
        max: 3
    }
});

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Import models
db.User = require("./user.model")(sequelize, Sequelize.DataTypes);
db.UserProfile = require("./userProfile.model")(sequelize, Sequelize.DataTypes);
db.WorkProfile = require("./workProfile.model")(sequelize, Sequelize.DataTypes);
db.Project = require("./project.model")(sequelize, Sequelize.DataTypes);
db.Address = require("./address.model")(sequelize, Sequelize.DataTypes);
db.TempAddress = require("./tempAddress.model")(sequelize, Sequelize.DataTypes);
db.SessionLog = require("./sessionLog.model")(sequelize, Sequelize.DataTypes);
db.TokenBlacklist = require("./tokenBlacklist.model")(sequelize, Sequelize.DataTypes);
db.Skill = require("./skill.model")(sequelize, Sequelize.DataTypes);
db.SubSkill = require("./subSkill.model")(sequelize, Sequelize.DataTypes);
db.UserSkill = require("./userSkill.model")(sequelize, Sequelize.DataTypes);
db.UserSkillReview = require("./userSkillReview.model")(sequelize, Sequelize.DataTypes);
db.Post = require("./post.model")(sequelize, Sequelize.DataTypes);
db.PostAttachment = require("./postAttachment.model")(sequelize, Sequelize.DataTypes);
db.AadhaarVerification = require("./aadhaarVerification.model")(sequelize, Sequelize.DataTypes);
db.AadhaarVerificationLog = require("./aadhaarVerificationLog.model")(sequelize, Sequelize.DataTypes);
db.TempAddress = require("./tempAddress.model")(sequelize, Sequelize.DataTypes);
db.DeviceToken = require("./deviceToken.model")(sequelize, Sequelize.DataTypes);

// Chat models
db.Conversation = require("./conversation.model")(sequelize, Sequelize.DataTypes);
db.ConversationMember = require("./conversationMember.model")(sequelize, Sequelize.DataTypes);
db.Message = require("./message.model")(sequelize, Sequelize.DataTypes);
db.MessageStatus = require("./messageStatus.model")(sequelize, Sequelize.DataTypes);
db.TypingStatus = require("./typingStatus.model")(sequelize, Sequelize.DataTypes);
db.Notification = require("./notification.model")(sequelize, Sequelize.DataTypes);
db.NotificationSettings = require("./notificationSettings.model")(sequelize, Sequelize.DataTypes);
db.ReferralLog = require("./referralLog.model")(sequelize, Sequelize.DataTypes);

// Feed models
db.FeedPost = require("./feedPost.model")(sequelize, Sequelize.DataTypes);
db.FeedAttachment = require("./feedAttachment.model")(sequelize, Sequelize.DataTypes);
db.FeedLike = require("./feedLike.model")(sequelize, Sequelize.DataTypes);
db.FeedComment = require("./feedComment.model")(sequelize, Sequelize.DataTypes);
db.FeedShare = require("./feedShare.model")(sequelize, Sequelize.DataTypes);
db.FeedFollow = require("./feedFollow.model")(sequelize, Sequelize.DataTypes);
db.FeedView = require("./feedView.model")(sequelize, Sequelize.DataTypes);

// Feedback model
db.Feedback = require("./feedback.model")(sequelize, Sequelize.DataTypes);

// Set up associations
Object.keys(db).forEach(modelName => {
    if (db[modelName].associate) {
        db[modelName].associate(db);
    }
});

module.exports = db;
