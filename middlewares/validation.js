const { body, param, query, validationResult } = require('express-validator');

// Common validation patterns
const patterns = {
  name: /^[a-zA-Z\s]+$/,
  password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
  phone: /^\+?[\d\s\-\(\)]+$/,
  username: /^[a-zA-Z0-9_]+$/,
  url: /^https?:\/\/.+/,
  date: /^\d{4}-\d{2}-\d{2}$/
};

// Validation error handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
      }))
    });
  }
  next();
};

// User registration validation
const validateUserRegistration = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .matches(patterns.name)
    .withMessage('Name can only contain letters and spaces'),
  
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail()
    .isLength({ max: 255 })
    .withMessage('Email is too long'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be between 8 and 128 characters')
    .matches(patterns.password)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  
  handleValidationErrors
];

// User login validation
const validateUserLogin = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  handleValidationErrors
];

// User update validation
const validateUserUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .matches(patterns.name)
    .withMessage('Name can only contain letters and spaces'),
  
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail()
    .isLength({ max: 255 })
    .withMessage('Email is too long'),
  
  body('password')
    .optional()
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be between 8 and 128 characters')
    .matches(patterns.password)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  
  handleValidationErrors
];

// User ID validation
const validateUserId = [
  param('id')
    .notEmpty()
    .withMessage('User ID is required')
    .isInt({ min: 1 })
    .withMessage('User ID must be a positive integer'),
  
  handleValidationErrors
];

// Pagination validation
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('sort')
    .optional()
    .isIn(['name', 'email', 'created_at'])
    .withMessage('Sort must be one of: name, email, created_at'),
  
  query('order')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Order must be either asc or desc'),
  
  handleValidationErrors
];

// Search validation
const validateSearch = [
  query('q')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Search query must be between 2 and 100 characters'),
  
  handleValidationErrors
];

// Email validation
const validateEmail = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  handleValidationErrors
];

// Password validation
const validatePassword = [
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be between 8 and 128 characters')
    .matches(patterns.password)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  
  handleValidationErrors
];

// Login validation
const validateLogin = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  handleValidationErrors
];

// Generic string validation
const validateString = (fieldName, minLength = 1, maxLength = 255, pattern = null) => {
  const validations = [
    body(fieldName)
      .trim()
      .notEmpty()
      .withMessage(`${fieldName} is required`)
      .isLength({ min: minLength, max: maxLength })
      .withMessage(`${fieldName} must be between ${minLength} and ${maxLength} characters`)
  ];
  
  if (pattern) {
    validations.push(
      body(fieldName)
        .matches(pattern)
        .withMessage(`${fieldName} format is invalid`)
    );
  }
  
  validations.push(handleValidationErrors);
  return validations;
};

// Generic number validation
const validateNumber = (fieldName, min = null, max = null) => {
  const validations = [
    body(fieldName)
      .notEmpty()
      .withMessage(`${fieldName} is required`)
      .isNumeric()
      .withMessage(`${fieldName} must be a number`)
  ];
  
  if (min !== null) {
    validations.push(
      body(fieldName)
        .isInt({ min })
        .withMessage(`${fieldName} must be at least ${min}`)
    );
  }
  
  if (max !== null) {
    validations.push(
      body(fieldName)
        .isInt({ max })
        .withMessage(`${fieldName} must be at most ${max}`)
    );
  }
  
  validations.push(handleValidationErrors);
  return validations;
};

// Generic date validation
const validateDate = (fieldName) => [
  body(fieldName)
    .notEmpty()
    .withMessage(`${fieldName} is required`)
    .isISO8601()
    .withMessage(`${fieldName} must be a valid date`),
  
  handleValidationErrors
];

// Custom validation to check if at least one field is provided
const validateAtLeastOneField = (req, res, next) => {
  const { name, email, phone, dob } = req.body;
  
  if (!name && !email && !phone && !dob) {
    return res.status(400).json({
      success: false,
      message: 'At least one field (name, email, phone, or dob) must be provided for update'
    });
  }
  
  next();
};

// Custom validation to ensure fields are not empty if provided
const validateNotEmpty = (fieldName, fieldDisplayName) => {
  return body(fieldName)
    .if(body(fieldName).exists())
    .custom((value) => {
      if (value === null || value === undefined || value === '') {
        throw new Error(`${fieldDisplayName} cannot be empty, null, or undefined`);
      }
      return true;
    });
};

// Profile update validation (name, email, phone, dob only)
const validateProfileUpdate = [
  // Validate at least one field is provided
  validateAtLeastOneField,
  
  // Name validation (optional but not empty if provided)
  validateNotEmpty('name', 'Name'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .matches(patterns.name)
    .withMessage('Name can only contain letters and spaces'),
  
  // Email validation (optional but not empty if provided)
  validateNotEmpty('email', 'Email'),
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail()
    .isLength({ max: 255 })
    .withMessage('Email is too long'),
  
  // Phone validation (optional but not empty if provided)
  validateNotEmpty('phone', 'Phone'),
  body('phone')
    .optional()
    .trim()
    .isLength({ min: 10, max: 20 })
    .withMessage('Phone number must be between 10 and 20 characters')
    .matches(/^\+?[\d\s\-\(\)]+$/)
    .withMessage('Phone number format is invalid'),
  
  // Date of birth validation (optional but not empty if provided)
  validateNotEmpty('dob', 'Date of birth'),
  body('dob')
    .optional()
    .matches(patterns.date)
    .withMessage('Date of birth must be in YYYY-MM-DD format')
    .custom((value) => {
      if (value) {
        const date = new Date(value);
        const today = new Date();
        const minAge = new Date(today.getFullYear() - 120, today.getMonth(), today.getDate());
        const maxAge = new Date(today.getFullYear() - 13, today.getMonth(), today.getDate());
        
        if (isNaN(date.getTime())) {
          throw new Error('Date of birth must be a valid date');
        }
        
        if (date > today) {
          throw new Error('Date of birth cannot be in the future');
        }
        
        if (date < minAge) {
          throw new Error('Date of birth cannot be more than 120 years ago');
        }
      }
      return true;
    }),
  
  handleValidationErrors
];

// Post creation validation
const validatePostCreation = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Title must be between 1 and 255 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ min: 1, max: 5000 })
    .withMessage('Description must be between 1 and 5000 characters'),
  
  body('required_skill_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Required skill ID must be a positive integer'),
  
  body('required_sub_skill_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Required sub-skill ID must be a positive integer'),
  
  body('medium')
    .optional()
    .isIn(['online', 'offline'])
    .withMessage('Medium must be either "online" or "offline"'),
  
  body('deadline')
    .optional()
    .isDate()
    .withMessage('Deadline must be a valid date')
    .custom((value) => {
      const today = new Date();
      const deadline = new Date(value);
      if (deadline < today) {
        throw new Error('Deadline cannot be in the past');
      }
      return true;
    }),
  
  // At least one of title or description should be provided
  body()
    .custom((value, { req }) => {
      if (!req.body.title && !req.body.description) {
        throw new Error('Either title or description must be provided');
      }
      return true;
    }),
  
  handleValidationErrors
];

// Post update validation
const validatePostUpdate = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Title must be between 1 and 255 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ min: 1, max: 5000 })
    .withMessage('Description must be between 1 and 5000 characters'),
  
  body('required_skill_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Required skill ID must be a positive integer'),
  
  body('required_sub_skill_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Required sub-skill ID must be a positive integer'),
  
  body('medium')
    .optional()
    .isIn(['online', 'offline'])
    .withMessage('Medium must be either "online" or "offline"'),
  
  body('status')
    .optional()
    .isIn(['active', 'hold', 'discussed', 'completed', 'deleted'])
    .withMessage('Status must be one of: active, hold, discussed, completed, deleted'),
  
  body('deadline')
    .optional()
    .custom((value) => {
      if (value === null || value === '') {
        return true; // Allow null/empty to clear deadline
      }
      
      if (!Date.parse(value)) {
        throw new Error('Deadline must be a valid date');
      }
      
      const today = new Date();
      const deadline = new Date(value);
      if (deadline < today) {
        throw new Error('Deadline cannot be in the past');
      }
      return true;
    }),
  
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateUserRegistration,
  validateUserLogin,
  validateUserUpdate,
  validateProfileUpdate,
  validateUserId,
  validatePagination,
  validateSearch,
  validateEmail,
  validatePassword,
  validateLogin,
  validateString,
  validateNumber,
  validateDate,
  validateAtLeastOneField,
  validateNotEmpty,
  validatePostCreation,
  validatePostUpdate,
  patterns
}; 