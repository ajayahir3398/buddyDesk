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
    .normalizeEmail({ gmail_remove_dots: false })
    .isLength({ max: 255 })
    .withMessage('Email is too long'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be between 8 and 128 characters')
    .matches(patterns.password)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  
  body('referred_by')
    .optional()
    .custom((value) => {
      // Allow null, undefined, or empty string
      if (value === null || value === undefined || value === '') {
        return true;
      }
      // If value is provided, trim and validate
      const trimmedValue = value.trim();
      if (trimmedValue === '') {
        return true; // Allow empty string after trimming
      }
      if (trimmedValue.length !== 6) {
        throw new Error('Referral code must be 6 characters long');
      }
      if (!/^[a-zA-Z0-9]+$/.test(trimmedValue)) {
        throw new Error('Referral code can only contain letters and numbers');
      }
      return true;
    }),

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
    .normalizeEmail({ gmail_remove_dots: false }),
  
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
    .normalizeEmail({ gmail_remove_dots: false })
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
    .normalizeEmail({ gmail_remove_dots: false }),
  
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
    .normalizeEmail({ gmail_remove_dots: false }),
  
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
  const { 
    name, email, phone, dob, gender, bio, addresses, temp_addresses, work_profiles,
    notification_settings
  } = req.body;
  
  if (!name && !email && !phone && !dob && !gender && !bio && !addresses && !temp_addresses && !work_profiles && !notification_settings) {
    return res.status(400).json({
      success: false,
      message: 'At least one field (name, email, phone, dob, gender, bio, addresses, temp_addresses, work_profiles, or notification_settings) must be provided for update'
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

// Profile update validation (name, email, phone, dob, addresses, temp_addresses)
const validateProfileUpdate = [
  // Validate at least one field is provided
  validateAtLeastOneField,

  // Profile image validation (optional)
  body('profile_image')
    .optional()
    .custom((value, { req }) => {
      // If there's a file uploaded, validate it
      if (req.file) {
        const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/jpg', 'image/webp'];
        if (!allowedMimeTypes.includes(req.file.mimetype)) {
          throw new Error('Profile image must be a valid image file (JPEG, PNG, GIF, WebP)');
        }
        // Check file size (25MB limit)
        if (req.file.size > 25 * 1024 * 1024) {
          throw new Error('Profile image must be less than 25MB');
        }
      }
      return true;
    }),
  
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
    .normalizeEmail({ gmail_remove_dots: false })
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

  // Gender validation (optional but not empty if provided)
  validateNotEmpty('gender', 'Gender'),
  body('gender')
    .optional()
    .isIn(['Male', 'Female', 'Other'])
    .withMessage('Gender must be one of: Male, Female, Other'),

  // Bio validation (optional text)
  validateNotEmpty('bio', 'Bio'),
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Bio must not exceed 1000 characters'),

  // Address validation (optional array)
  body('addresses')
    .optional()
    .isArray()
    .withMessage('Addresses must be an array'),
  
  body('addresses.*.street')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Street address is too long'),
  
  body('addresses.*.city')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('City name is too long'),
  
  body('addresses.*.state')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('State name is too long'),
  
  body('addresses.*.zip_code')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('Zip code is too long'),
  
  body('addresses.*.country')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Country name is too long'),
  
  body('addresses.*.type')
    .optional()
    .isIn(['home', 'office'])
    .withMessage('Address type must be either "home" or "office"'),

  // Temp Address validation (optional array)
  body('temp_addresses')
    .optional()
    .isArray()
    .withMessage('Temporary addresses must be an array'),
  
  body('temp_addresses.*.location_data')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Location data is too long'),
  
  body('temp_addresses.*.pincode')
    .optional()
    .trim()
    .isLength({ min: 6, max: 6 })
    .withMessage('Pincode must be exactly 6 characters'),
  
  body('temp_addresses.*.selected_area')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Selected area is too long'),
  
  body('temp_addresses.*.city')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('City name is too long'),
  
  body('temp_addresses.*.state')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('State name is too long'),
  
  body('temp_addresses.*.country')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Country name is too long'),
  
  body('temp_addresses.*.location_permission')
    .optional()
    .isBoolean()
    .withMessage('Location permission must be a boolean'),
  
  body('temp_addresses.*.is_active')
    .optional()
    .isBoolean()
    .withMessage('Active status must be a boolean'),
  
  body('temp_addresses.*.expires_at')
    .optional()
    .matches(patterns.date)
    .withMessage('Expiry date must be in YYYY-MM-DD format'),

  // Work Profile validation (optional array)
  body('work_profiles')
    .optional()
    .isArray()
    .withMessage('Work profiles must be an array'),
  
  body('work_profiles.*.company_name')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Company name is too long'),
  
  body('work_profiles.*.designation')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Designation is too long'),
  
  body('work_profiles.*.start_date')
    .optional()
    .matches(patterns.date)
    .withMessage('Start date must be in YYYY-MM-DD format')
    .custom((value) => {
      if (value) {
        const date = new Date(value);
        if (isNaN(date.getTime())) {
          throw new Error('Start date must be a valid date');
        }
        if (date > new Date()) {
          throw new Error('Start date cannot be in the future');
        }
      }
      return true;
    }),
  
  body('work_profiles.*.end_date')
    .optional()
    .matches(patterns.date)
    .withMessage('End date must be in YYYY-MM-DD format')
    .custom((value, { req, path }) => {
      if (value) {
        const date = new Date(value);
        if (isNaN(date.getTime())) {
          throw new Error('End date must be a valid date');
        }
        
        // Get the index of the work profile being validated
        const workProfileIndex = path.split('.')[1];
        const startDate = req.body.work_profiles?.[workProfileIndex]?.start_date;
        
        if (startDate && date <= new Date(startDate)) {
          throw new Error('End date must be after start date');
        }
      }
      return true;
    }),

  // User Skills validation within work profiles
  body('work_profiles.*.user_skills')
    .optional()
    .isArray()
    .withMessage('User skills must be an array'),
  
  body('work_profiles.*.user_skills.*.skill_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Skill ID must be a positive integer'),
  
  body('work_profiles.*.user_skills.*.sub_skill_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Sub-skill ID must be a positive integer'),
  
  body('work_profiles.*.user_skills.*.proficiency_level')
    .optional()
    .isIn(['Beginner', 'Intermediate', 'Expert'])
    .withMessage('Proficiency level must be one of: Beginner, Intermediate, Expert'),

  // Notification Settings validation (optional nested object with boolean fields)
  body('notification_settings')
    .optional()
    .isObject()
    .withMessage('Notification settings must be an object'),

  body('notification_settings.push_notification')
    .optional()
    .isBoolean()
    .withMessage('Push notification must be a boolean value'),

  body('notification_settings.general_notification')
    .optional()
    .isBoolean()
    .withMessage('General notification must be a boolean value'),

  body('notification_settings.skill_exchange_notification')
    .optional()
    .isBoolean()
    .withMessage('Skill exchange notification must be a boolean value'),

  body('notification_settings.message_notification')
    .optional()
    .isBoolean()
    .withMessage('Message notification must be a boolean value'),

  body('notification_settings.marketing_notification')
    .optional()
    .isBoolean()
    .withMessage('Marketing notification must be a boolean value'),
  
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

// Change password validation
const validateChangePassword = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail({ gmail_remove_dots: false }),
  
  body('new_password')
    .notEmpty()
    .withMessage('New password is required')
    .isLength({ min: 8, max: 128 })
    .withMessage('New password must be between 8 and 128 characters')
    .matches(patterns.password)
    .withMessage('New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  
  handleValidationErrors
];

// Feedback validation
const validateFeedback = [
  body('type')
    .optional()
    .isIn(['bug', 'feature_request', 'general', 'complaint', 'suggestion'])
    .withMessage('Feedback type must be one of: bug, feature_request, general, complaint, suggestion'),
  
  body('subject')
    .trim()
    .notEmpty()
    .withMessage('Subject is required')
    .isLength({ min: 5, max: 255 })
    .withMessage('Subject must be between 5 and 255 characters'),
  
  body('message')
    .trim()
    .notEmpty()
    .withMessage('Message is required')
    .isLength({ min: 10, max: 5000 })
    .withMessage('Message must be between 10 and 5000 characters'),
  
  body('rating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  
  handleValidationErrors
];

// Forgot password validation
const validateForgotPassword = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail({ gmail_remove_dots: false }),
  
  handleValidationErrors
];

// Verify OTP validation
const validateVerifyOTP = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail({ gmail_remove_dots: false }),
  
  body('otp')
    .notEmpty()
    .withMessage('OTP is required')
    .isLength({ min: 6, max: 6 })
    .withMessage('OTP must be 6 digits')
    .isNumeric()
    .withMessage('OTP must contain only numbers'),
  
  handleValidationErrors
];

// Reset password validation
const validateResetPassword = [
  body('reset_token')
    .notEmpty()
    .withMessage('Reset token is required')
    .isString()
    .withMessage('Reset token must be a valid string'),
  
  body('new_password')
    .notEmpty()
    .withMessage('New password is required')
    .isLength({ min: 8, max: 128 })
    .withMessage('New password must be between 8 and 128 characters')
    .matches(patterns.password)
    .withMessage('New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  
  handleValidationErrors
];

// Resend registration OTP validation
const validateResendRegistrationOTP = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail({ gmail_remove_dots: false })
    .isLength({ max: 255 })
    .withMessage('Email is too long'),

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
  validateChangePassword,
  validateFeedback,
  validateForgotPassword,
  validateVerifyOTP,
  validateResetPassword,
  validateResendRegistrationOTP,
  patterns
};