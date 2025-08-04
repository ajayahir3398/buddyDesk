const Sequelize = require("sequelize");
const dbConfig = require("../config/db.config");

const sequelize = new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, {
    host: dbConfig.HOST,
    dialect: dbConfig.DIALECT,
    port: dbConfig.PORT,
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
db.SessionLog = require("./sessionLog.model")(sequelize, Sequelize.DataTypes);
db.TokenBlacklist = require("./tokenBlacklist.model")(sequelize, Sequelize.DataTypes);
db.Skill = require("./skill.model")(sequelize, Sequelize.DataTypes);
db.SubSkill = require("./subSkill.model")(sequelize, Sequelize.DataTypes);
db.UserSkill = require("./userSkill.model")(sequelize, Sequelize.DataTypes);
db.UserSkillReview = require("./userSkillReview.model")(sequelize, Sequelize.DataTypes);
db.Post = require("./post.model")(sequelize, Sequelize.DataTypes);
db.PostAttachment = require("./postAttachment.model")(sequelize, Sequelize.DataTypes);

// Set up associations
Object.keys(db).forEach(modelName => {
    if (db[modelName].associate) {
        db[modelName].associate(db);
    }
});

module.exports = db;
