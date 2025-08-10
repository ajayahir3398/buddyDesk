const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// API Endpoints Data
const apiEndpoints = [
  // Health Endpoints
  {
    category: 'Health',
    method: 'GET',
    endpoint: '/health',
    fullUrl: 'https://buddydesk.onrender.com/health',
    description: 'Basic health check',
    authentication: 'None',
    requestBody: 'None',
    queryParams: 'None',
    responseExample: '{"success": true, "message": "Service is healthy", "data": {"status": "OK", "timestamp": "2024-01-01T00:00:00.000Z", "uptime": 3600, "environment": "production", "version": "1.0.0", "database": "connected"}}',
    statusCodes: '200 - OK, 503 - Service Unavailable'
  },
  {
    category: 'Health',
    method: 'GET',
    endpoint: '/health/detailed',
    fullUrl: 'https://buddydesk.onrender.com/health/detailed',
    description: 'Detailed health check with system information',
    authentication: 'None',
    requestBody: 'None',
    queryParams: 'None',
    responseExample: '{"success": true, "message": "Service is healthy", "data": {"status": "OK", "database": {"status": "connected", "responseTime": "15ms"}, "memory": {"used": 50, "total": 100}, "process": {"pid": 1234, "nodeVersion": "v18.0.0"}}}',
    statusCodes: '200 - OK, 503 - Service Unavailable'
  },

  // User Endpoints
  {
    category: 'Users',
    method: 'POST',
    endpoint: '/api/users/register',
    fullUrl: 'https://buddydesk.onrender.com/api/users/register',
    description: 'Register a new user account',
    authentication: 'None',
    requestBody: '{"name": "John Doe", "email": "john.doe@example.com", "password": "TestPass123!"}',
    queryParams: 'None',
    responseExample: '{"success": true, "message": "User registered successfully", "data": {"id": 1, "name": "John Doe", "email": "john.doe@example.com", "created_at": "2024-01-01T00:00:00.000Z"}}',
    statusCodes: '201 - Created, 400 - Validation Error, 409 - User Already Exists'
  },
  {
    category: 'Users',
    method: 'POST',
    endpoint: '/api/users/login',
    fullUrl: 'https://buddydesk.onrender.com/api/users/login',
    description: 'Login user and get access token',
    authentication: 'None',
    requestBody: '{"email": "john.doe@example.com", "password": "TestPass123!"}',
    queryParams: 'None',
    responseExample: '{"success": true, "message": "Login successful", "data": {"user": {"id": 1, "name": "John Doe", "email": "john.doe@example.com"}, "accessToken": "jwt_token_here", "refreshToken": "refresh_token_here"}}',
    statusCodes: '200 - OK, 400 - Validation Error, 401 - Invalid Credentials'
  },
  {
    category: 'Users',
    method: 'POST',
    endpoint: '/api/users/refresh-token',
    fullUrl: 'https://buddydesk.onrender.com/api/users/refresh-token',
    description: 'Refresh access token using refresh token',
    authentication: 'None',
    requestBody: '{"refreshToken": "refresh_token_here"}',
    queryParams: 'None',
    responseExample: '{"success": true, "message": "Token refreshed successfully", "data": {"accessToken": "new_jwt_token", "refreshToken": "new_refresh_token"}}',
    statusCodes: '200 - OK, 401 - Invalid Refresh Token'
  },
  {
    category: 'Users',
    method: 'POST',
    endpoint: '/api/users/logout',
    fullUrl: 'https://buddydesk.onrender.com/api/users/logout',
    description: 'Logout user and invalidate tokens',
    authentication: 'None',
    requestBody: '{"refreshToken": "refresh_token_here"}',
    queryParams: 'None',
    responseExample: '{"success": true, "message": "Logout successful"}',
    statusCodes: '200 - OK, 400 - Invalid Token'
  },
  {
    category: 'Users',
    method: 'GET',
    endpoint: '/api/users/profile',
    fullUrl: 'https://buddydesk.onrender.com/api/users/profile',
    description: 'Get current user profile with complete information',
    authentication: 'Bearer Token',
    requestBody: 'None',
    queryParams: 'None',
    responseExample: '{"success": true, "message": "Profile retrieved successfully", "data": {"id": 1, "name": "John Doe", "email": "john.doe@example.com", "profile": {...}, "work_profiles": [...], "addresses": [...]}}',
    statusCodes: '200 - OK, 401 - Unauthorized, 404 - User Not Found'
  },
  {
    category: 'Users',
    method: 'GET',
    endpoint: '/api/users/profile/:id',
    fullUrl: 'https://buddydesk.onrender.com/api/users/profile/1',
    description: 'Get specific user profile by ID',
    authentication: 'Bearer Token',
    requestBody: 'None',
    queryParams: 'None',
    responseExample: '{"success": true, "message": "Profile retrieved successfully", "data": {"id": 1, "name": "John Doe", "email": "john.doe@example.com", "profile": {...}}}',
    statusCodes: '200 - OK, 401 - Unauthorized, 404 - User Not Found'
  },
  {
    category: 'Users',
    method: 'PUT',
    endpoint: '/api/users/profile',
    fullUrl: 'https://buddydesk.onrender.com/api/users/profile',
    description: 'Update current user profile',
    authentication: 'Bearer Token',
    requestBody: '{"name": "Updated Name", "profile": {"bio": "Updated bio", "phone": "+1234567890"}, "addresses": [...], "work_profiles": [...]}',
    queryParams: 'None',
    responseExample: '{"success": true, "message": "Profile updated successfully", "data": {"id": 1, "name": "Updated Name", "profile": {...}}}',
    statusCodes: '200 - OK, 400 - Validation Error, 401 - Unauthorized'
  },
  {
    category: 'Users',
    method: 'GET',
    endpoint: '/api/users/public-profile/:id',
    fullUrl: 'https://buddydesk.onrender.com/api/users/public-profile/1',
    description: 'Get public profile information for a user',
    authentication: 'Bearer Token',
    requestBody: 'None',
    queryParams: 'None',
    responseExample: '{"success": true, "message": "Public profile retrieved successfully", "data": {"id": 1, "name": "John Doe", "profile": {...}, "work_profiles": [...]}}',
    statusCodes: '200 - OK, 401 - Unauthorized, 404 - User Not Found'
  },

  // Skills Endpoints
  {
    category: 'Skills',
    method: 'GET',
    endpoint: '/api/skills',
    fullUrl: 'https://buddydesk.onrender.com/api/skills',
    description: 'Get all available skills',
    authentication: 'Bearer Token',
    requestBody: 'None',
    queryParams: 'None',
    responseExample: '{"success": true, "message": "Skills retrieved successfully", "data": [{"id": 1, "name": "Programming", "description": "Software development skills", "subSkills": [...]}]}',
    statusCodes: '200 - OK, 401 - Unauthorized'
  },
  {
    category: 'Skills',
    method: 'GET',
    endpoint: '/api/skills/:id',
    fullUrl: 'https://buddydesk.onrender.com/api/skills/1',
    description: 'Get specific skill by ID with sub-skills',
    authentication: 'Bearer Token',
    requestBody: 'None',
    queryParams: 'None',
    responseExample: '{"success": true, "message": "Skill retrieved successfully", "data": {"id": 1, "name": "Programming", "description": "Software development", "subSkills": [...]}}',
    statusCodes: '200 - OK, 401 - Unauthorized, 404 - Skill Not Found'
  },
  {
    category: 'Skills',
    method: 'GET',
    endpoint: '/api/skills/sub-skills/all',
    fullUrl: 'https://buddydesk.onrender.com/api/skills/sub-skills/all',
    description: 'Get all sub-skills across all skills',
    authentication: 'Bearer Token',
    requestBody: 'None',
    queryParams: 'None',
    responseExample: '{"success": true, "message": "Sub-skills retrieved successfully", "data": [{"id": 1, "name": "React.js", "skill_id": 1, "skill": {...}}]}',
    statusCodes: '200 - OK, 401 - Unauthorized'
  },
  {
    category: 'Skills',
    method: 'GET',
    endpoint: '/api/skills/sub-skills/:skillId',
    fullUrl: 'https://buddydesk.onrender.com/api/skills/sub-skills/1',
    description: 'Get sub-skills for a specific skill',
    authentication: 'Bearer Token',
    requestBody: 'None',
    queryParams: 'None',
    responseExample: '{"success": true, "message": "Sub-skills retrieved successfully", "data": [{"id": 1, "name": "React.js", "description": "React JavaScript library"}]}',
    statusCodes: '200 - OK, 401 - Unauthorized, 404 - Skill Not Found'
  },

  // Posts Endpoints
  {
    category: 'Posts',
    method: 'POST',
    endpoint: '/api/posts',
    fullUrl: 'https://buddydesk.onrender.com/api/posts',
    description: 'Create a new post with optional file attachments',
    authentication: 'Bearer Token',
    requestBody: 'multipart/form-data: title, description, required_skill_id, required_sub_skill_id, medium, deadline, attachments[]',
    queryParams: 'None',
    responseExample: '{"success": true, "message": "Post created successfully", "data": {"id": 1, "title": "Need React Developer", "description": "...", "user": {...}, "requiredSkill": {...}, "attachments": [...]}}',
    statusCodes: '201 - Created, 400 - Validation Error, 401 - Unauthorized'
  },
  {
    category: 'Posts',
    method: 'GET',
    endpoint: '/api/posts',
    fullUrl: 'https://buddydesk.onrender.com/api/posts',
    description: 'Get all posts with filtering and pagination',
    authentication: 'Bearer Token',
    requestBody: 'None',
    queryParams: 'page, limit, status, medium, skill_id',
    responseExample: '{"success": true, "message": "Posts retrieved successfully", "data": [...], "pagination": {"currentPage": 1, "totalPages": 5, "totalItems": 47}}',
    statusCodes: '200 - OK, 401 - Unauthorized'
  },
  {
    category: 'Posts',
    method: 'GET',
    endpoint: '/api/posts/matching',
    fullUrl: 'https://buddydesk.onrender.com/api/posts/matching',
    description: 'Get posts matching user skills, sub-skills, and location',
    authentication: 'Bearer Token',
    requestBody: 'None',
    queryParams: 'page, limit, status, medium, min_match_score, match_skills, match_sub_skills, match_location',
    responseExample: '{"success": true, "message": "Matching posts retrieved successfully", "data": [...], "matchingCriteria": {"enabled": {...}, "userDataCounts": {...}}}',
    statusCodes: '200 - OK, 400 - Invalid Criteria, 401 - Unauthorized'
  },
  {
    category: 'Posts',
    method: 'GET',
    endpoint: '/api/posts/:id',
    fullUrl: 'https://buddydesk.onrender.com/api/posts/1',
    description: 'Get specific post by ID with all details',
    authentication: 'Bearer Token',
    requestBody: 'None',
    queryParams: 'None',
    responseExample: '{"success": true, "message": "Post retrieved successfully", "data": {"id": 1, "title": "...", "user": {...}, "requiredSkill": {...}, "attachments": [...]}}',
    statusCodes: '200 - OK, 401 - Unauthorized, 404 - Post Not Found'
  },
  {
    category: 'Posts',
    method: 'PUT',
    endpoint: '/api/posts/:id',
    fullUrl: 'https://buddydesk.onrender.com/api/posts/1',
    description: 'Update existing post (owner only)',
    authentication: 'Bearer Token',
    requestBody: '{"title": "Updated Title", "description": "Updated description", "status": "hold", "medium": "offline", "deadline": "2025-01-15"}',
    queryParams: 'None',
    responseExample: '{"success": true, "message": "Post updated successfully", "data": {"id": 1, "title": "Updated Title", "status": "hold", "updated_at": "..."}}',
    statusCodes: '200 - OK, 400 - Validation Error, 401 - Unauthorized, 404 - Post Not Found'
  },
  {
    category: 'Posts',
    method: 'POST',
    endpoint: '/api/posts/:id/attachments',
    fullUrl: 'https://buddydesk.onrender.com/api/posts/1/attachments',
    description: 'Add file attachments to existing post',
    authentication: 'Bearer Token',
    requestBody: 'multipart/form-data: attachments[] (max 5 files, 5MB each)',
    queryParams: 'None',
    responseExample: '{"success": true, "message": "Attachments uploaded successfully", "data": [{"id": 1, "file_name": "document.pdf", "file_path": "uploads/posts/...", "mime_type": "application/pdf"}]}',
    statusCodes: '201 - Created, 400 - File Error, 401 - Unauthorized, 404 - Post Not Found'
  },
  {
    category: 'Posts',
    method: 'GET',
    endpoint: '/api/posts/attachments/:attachmentId/download',
    fullUrl: 'https://buddydesk.onrender.com/api/posts/attachments/1/download',
    description: 'Download specific attachment file',
    authentication: 'Bearer Token',
    requestBody: 'None',
    queryParams: 'None',
    responseExample: 'Binary file download with appropriate headers',
    statusCodes: '200 - OK, 401 - Unauthorized, 404 - Attachment Not Found'
  },
  {
    category: 'Posts',
    method: 'DELETE',
    endpoint: '/api/posts/attachments/:attachmentId',
    fullUrl: 'https://buddydesk.onrender.com/api/posts/attachments/1',
    description: 'Delete attachment (post owner only)',
    authentication: 'Bearer Token',
    requestBody: 'None',
    queryParams: 'None',
    responseExample: '{"success": true, "message": "Attachment deleted successfully"}',
    statusCodes: '200 - OK, 401 - Unauthorized, 403 - Forbidden, 404 - Attachment Not Found'
  }
];

// Query Parameters Details
const queryParamsDetails = [
  {
    endpoint: '/api/posts',
    parameter: 'page',
    type: 'integer',
    required: false,
    default: '1',
    description: 'Page number for pagination'
  },
  {
    endpoint: '/api/posts',
    parameter: 'limit',
    type: 'integer',
    required: false,
    default: '10',
    description: 'Number of items per page (max: 100)'
  },
  {
    endpoint: '/api/posts',
    parameter: 'status',
    type: 'string',
    required: false,
    default: 'active',
    description: 'Filter by post status: active, hold, discussed, completed, deleted'
  },
  {
    endpoint: '/api/posts',
    parameter: 'medium',
    type: 'string',
    required: false,
    default: 'none',
    description: 'Filter by collaboration medium: online, offline'
  },
  {
    endpoint: '/api/posts',
    parameter: 'skill_id',
    type: 'integer',
    required: false,
    default: 'none',
    description: 'Filter by required skill ID'
  },
  {
    endpoint: '/api/posts/matching',
    parameter: 'page',
    type: 'integer',
    required: false,
    default: '1',
    description: 'Page number for pagination'
  },
  {
    endpoint: '/api/posts/matching',
    parameter: 'limit',
    type: 'integer',
    required: false,
    default: '10',
    description: 'Number of items per page (max: 100)'
  },
  {
    endpoint: '/api/posts/matching',
    parameter: 'status',
    type: 'string',
    required: false,
    default: 'active',
    description: 'Filter by post status'
  },
  {
    endpoint: '/api/posts/matching',
    parameter: 'medium',
    type: 'string',
    required: false,
    default: 'none',
    description: 'Filter by collaboration medium'
  },
  {
    endpoint: '/api/posts/matching',
    parameter: 'min_match_score',
    type: 'integer',
    required: false,
    default: 'none',
    description: 'Minimum match percentage (0-100)'
  },
  {
    endpoint: '/api/posts/matching',
    parameter: 'match_skills',
    type: 'boolean',
    required: false,
    default: 'true',
    description: 'Enable skill-based matching'
  },
  {
    endpoint: '/api/posts/matching',
    parameter: 'match_sub_skills',
    type: 'boolean',
    required: false,
    default: 'true',
    description: 'Enable sub-skill-based matching'
  },
  {
    endpoint: '/api/posts/matching',
    parameter: 'match_location',
    type: 'boolean',
    required: false,
    default: 'true',
    description: 'Enable location/pincode-based matching'
  }
];

// Authentication Details
const authDetails = [
  {
    type: 'None',
    description: 'No authentication required',
    headerExample: 'None',
    endpoints: 'Health checks, User registration, Login, Refresh token, Logout'
  },
  {
    type: 'Bearer Token',
    description: 'JWT access token required in Authorization header',
    headerExample: 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    endpoints: 'All other endpoints (Profile, Skills, Posts)'
  }
];

// Response Status Codes
const statusCodes = [
  {
    code: '200',
    description: 'OK - Request successful',
    usage: 'GET requests, successful updates'
  },
  {
    code: '201',
    description: 'Created - Resource created successfully',
    usage: 'POST requests (registration, post creation, file upload)'
  },
  {
    code: '400',
    description: 'Bad Request - Validation error or invalid data',
    usage: 'Invalid input, validation failures, file upload errors'
  },
  {
    code: '401',
    description: 'Unauthorized - Authentication required or invalid',
    usage: 'Missing/invalid JWT token, expired token'
  },
  {
    code: '403',
    description: 'Forbidden - Access denied',
    usage: 'User lacks permission for the resource'
  },
  {
    code: '404',
    description: 'Not Found - Resource does not exist',
    usage: 'User/Post/Skill not found, invalid IDs'
  },
  {
    code: '409',
    description: 'Conflict - Resource already exists',
    usage: 'Email already registered, duplicate data'
  },
  {
    code: '500',
    description: 'Internal Server Error - Server-side error',
    usage: 'Database errors, unexpected server issues'
  },
  {
    code: '503',
    description: 'Service Unavailable - Service is down',
    usage: 'Health check failures, database connection issues'
  }
];

// Create workbook
const wb = XLSX.utils.book_new();

// API Endpoints Sheet
const ws1 = XLSX.utils.json_to_sheet(apiEndpoints);
XLSX.utils.book_append_sheet(wb, ws1, "API Endpoints");

// Query Parameters Sheet
const ws2 = XLSX.utils.json_to_sheet(queryParamsDetails);
XLSX.utils.book_append_sheet(wb, ws2, "Query Parameters");

// Authentication Sheet
const ws3 = XLSX.utils.json_to_sheet(authDetails);
XLSX.utils.book_append_sheet(wb, ws3, "Authentication");

// Status Codes Sheet
const ws4 = XLSX.utils.json_to_sheet(statusCodes);
XLSX.utils.book_append_sheet(wb, ws4, "Status Codes");

// Add API Information Sheet
const apiInfo = [{
  title: 'BuddyDesk API Documentation',
  version: '1.0.0',
  baseUrl: 'https://buddydesk.onrender.com',
  description: 'Complete API for BuddyDesk platform including user authentication, profile management, skills management, and post operations with file attachments.',
  swaggerUrl: 'https://buddydesk.onrender.com/api-docs',
  contactEmail: 'support@buddydesk.com',
  environment: 'Production',
  lastUpdated: new Date().toISOString(),
  totalEndpoints: apiEndpoints.length,
  categories: 'Health, Users, Skills, Posts',
  features: 'JWT Authentication, File Upload, Real-time Matching, Profile Management, Skills System'
}];

const ws5 = XLSX.utils.json_to_sheet(apiInfo);
XLSX.utils.book_append_sheet(wb, ws5, "API Information");

// Set column widths for better readability
const sheets = wb.SheetNames;
sheets.forEach(sheetName => {
  const ws = wb.Sheets[sheetName];
  const range = XLSX.utils.decode_range(ws['!ref']);
  
  // Set default column widths
  ws['!cols'] = [];
  for (let col = range.s.c; col <= range.e.c; col++) {
    ws['!cols'][col] = { wch: 20 }; // Default width
  }
  
  // Set specific widths for certain columns
  if (sheetName === 'API Endpoints') {
    ws['!cols'][2] = { wch: 40 }; // endpoint column
    ws['!cols'][3] = { wch: 50 }; // fullUrl column
    ws['!cols'][4] = { wch: 50 }; // description column
    ws['!cols'][7] = { wch: 30 }; // requestBody column
    ws['!cols'][9] = { wch: 80 }; // responseExample column
  }
});

// Write file
const filename = 'BuddyDesk_API_Documentation.xlsx';
XLSX.writeFile(wb, filename);

console.log(`✅ Excel file created successfully: ${filename}`);
console.log(`📊 Total endpoints documented: ${apiEndpoints.length}`);
console.log(`📋 Sheets created: ${wb.SheetNames.join(', ')}`);
console.log(`🔗 Base URL: https://buddydesk.onrender.com`);
console.log(`📖 Swagger Docs: https://buddydesk.onrender.com/api-docs`);