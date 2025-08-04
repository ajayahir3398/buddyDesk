const db = require("../models");
const Skill = db.Skill;
const SubSkill = db.SubSkill;

// Get all skills with their sub-skills
exports.getAllSkills = async (req, res) => {
  try {
    const skills = await Skill.findAll({
      include: [
        {
          model: SubSkill,
          as: 'subSkills',
          attributes: ['id', 'name', 'description']
        }
      ],
      attributes: ['id', 'name', 'description']
    });

    res.status(200).json({
      success: true,
      message: 'Skills retrieved successfully',
      data: skills
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get a specific skill with its sub-skills
exports.getSkillById = async (req, res) => {
  try {
    const { id } = req.params;

    const skill = await Skill.findByPk(id, {
      include: [
        {
          model: SubSkill,
          as: 'subSkills',
          attributes: ['id', 'name', 'description']
        }
      ],
      attributes: ['id', 'name', 'description']
    });

    if (!skill) {
      return res.status(404).json({
        success: false,
        message: 'Skill not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Skill retrieved successfully',
      data: skill
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get all sub-skills
exports.getAllSubSkills = async (req, res) => {
  try {
    const subSkills = await SubSkill.findAll({
      include: [
        {
          model: Skill,
          as: 'skill',
          attributes: ['id', 'name', 'description']
        }
      ],
      attributes: ['id', 'name', 'description', 'skill_id']
    });

    res.status(200).json({
      success: true,
      message: 'Sub-skills retrieved successfully',
      data: subSkills
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get sub-skills by skill ID
exports.getSubSkillsBySkillId = async (req, res) => {
  try {
    const { skillId } = req.params;

    // Get the skill with its sub-skills for better structure
    const skill = await Skill.findByPk(skillId, {
      include: [
        {
          model: SubSkill,
          as: 'subSkills',
          attributes: ['id', 'name', 'description']
        }
      ],
      attributes: ['id', 'name', 'description']
    });

    if (!skill) {
      return res.status(404).json({
        success: false,
        message: 'Skill not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Sub-skills retrieved successfully',
      data: {
        skill: {
          id: skill.id,
          name: skill.name,
          description: skill.description
        },
        subSkills: skill.subSkills
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
}; 