# BuddyDesk API

A comprehensive Node.js Express API for the BuddyDesk platform with advanced features and security.

## Features

- **User Management**: Registration, authentication, and profile management
- **Skills System**: Skills and sub-skills management with hierarchical relationships
- **Profile Management**: Comprehensive user profiles with work history
- **Security**: JWT authentication, token blacklisting, and secure CORS
- **Validation**: Comprehensive input validation with express-validator
- **Error Handling**: Structured error responses and logging
- **Database**: PostgreSQL with Sequelize ORM
- **Documentation**: Complete Swagger/OpenAPI documentation
- **Monitoring**: Health check endpoints and request tracking
- **Logging**: Structured logging with Winston
- **Environment Management**: Environment variable validation

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file with your configuration:
```env
# Application Configuration
NODE_ENV=development
PORT=3000

# Database Configuration
DB_HOST=your_db_host
DB_USER=buddydesk_user
DB_PASSWORD=your_secure_password_here
DB_NAME=your_database_name
DB_PORT=5432

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here_change_in_production
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Production Configuration
PRODUCTION_URL=https://buddydesk-eumd.onrender.com/api

# Security Configuration
CORS_ORIGIN_DEVELOPMENT=http://localhost:3000,http://localhost:3001
CORS_ORIGIN_PRODUCTION=https://yourdomain.com

# Logging Configuration
LOG_LEVEL=info

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Firebase Notifications
# Base64-encoded service account JSON (see README for instructions)
FIREBASE_SERVICE_ACCOUNT_JSON=
```

3. Start the server:
```bash
npm run dev
```

## API Endpoints

### Health Check
- **GET** `/health` - Basic health check
- **GET** `/health/detailed` - Detailed health check with system information

### User Registration
- **POST** `/api/users/register`
- **Body:**
  ```json
  {
    "name": "John Doe",
    "email": "john.doe@example.com",
    "password": "TestPass123!"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "message": "User registered successfully",
    "data": {
      "id": 1,
      "name": "John Doe",
      "email": "john.doe@example.com",
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  }
  ```

### User Login
- **POST** `/api/users/login`
- **Body:**
  ```json
  {
    "email": "john.doe@example.com",
    "password": "TestPass123!"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "message": "Login successful",
    "data": {
      "user": {
        "id": 1,
        "name": "John Doe",
        "email": "john.doe@example.com",
        "created_at": "2024-01-01T00:00:00.000Z"
      },
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
  ```

### Get All Users
- **GET** `/api/users`
- **Query Parameters:**
  - `page` (optional): Page number (default: 1)
  - `limit` (optional): Items per page (default: 10, max: 100)
  - `sort` (optional): Sort field (name, email, created_at)
  - `order` (optional): Sort order (asc, desc)
  - `q` (optional): Search query
- **Response:**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": 1,
        "name": "John Doe",
        "email": "john.doe@example.com",
        "created_at": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 1,
      "totalItems": 1,
      "itemsPerPage": 10,
      "hasNextPage": false,
      "hasPrevPage": false
    }
  }
  ```

### Get User by ID
- **GET** `/api/users/:id`
- **Response:**
  ```json
  {
    "success": true,
    "data": {
      "id": 1,
      "name": "John Doe",
      "email": "john.doe@example.com",
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  }
  ```

## Validation Rules

### Registration
- **Name:** 2-50 characters, letters and spaces only, required
- **Email:** Valid email format, unique, required, max 255 characters
- **Password:** 8-128 characters, must contain uppercase, lowercase, number, and special character

### Login
- **Email:** Valid email format, required
- **Password:** Required

### Pagination
- **Page:** Positive integer (default: 1)
- **Limit:** Integer between 1-100 (default: 10)
- **Sort:** One of: name, email, created_at
- **Order:** asc or desc

### Search
- **Query:** 2-100 characters (optional)

### User ID
- **ID:** Positive integer

## Database Schema

The API uses the following PostgreSQL table structure:

```sql
CREATE TABLE IF NOT EXISTS public."user" (
    id integer NOT NULL DEFAULT nextval('user_id_seq'::regclass),
    name character varying,
    email character varying,
    password character varying,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone,
    CONSTRAINT user_pkey PRIMARY KEY (id),
    CONSTRAINT user_email_key UNIQUE (email)
);
```

## Testing

Run the validation test script to verify the API:
```bash
node test-validation.js
```

Run the registration test script:
```bash
node test-registration.js
```

## API Documentation

Access the Swagger documentation at: `http://localhost:3000/api-docs`

### Notifications

- POST `/api/notifications/token` (auth)
  - body: `{ fcmToken: string, platform?: 'ios'|'android'|'web'|'unknown', deviceInfo?: object }`

- POST `/api/notifications/test` (auth)
  - body: `{ userId?: number, title?: string, body?: string, data?: object }`
  - Sends a test push to provided userId or the current user

## Validation Middleware

The API includes a comprehensive validation middleware system:

### Available Validators
- `validateUserRegistration` - User registration validation
- `validateUserUpdate` - User update validation (optional fields)
- `validateUserId` - User ID parameter validation
- `validatePagination` - Pagination query parameters
- `validateSearch` - Search query validation
- `validateEmail` - Email validation
- `validatePassword` - Password validation
- `validateLogin` - Login validation
- `validateString` - Generic string validation
- `validateNumber` - Generic number validation
- `validateDate` - Date validation

### Usage Example
```javascript
const { validateUserRegistration } = require('./middlewares/validation');

router.post('/register', validateUserRegistration, userController.register);
```

## Authentication Middleware

The API includes authentication middleware for protecting routes:

### Available Middleware
- `authenticateToken` - Verify JWT token
- `optionalAuth` - Optional authentication
- `authorizeRoles` - Role-based authorization
- `authorizeResource` - Resource ownership check

### Usage Example
```javascript
const { authenticateToken, authorizeRoles } = require('./middlewares/auth');

router.get('/protected', authenticateToken, userController.getProfile);
router.get('/admin', authenticateToken, authorizeRoles('admin'), adminController.dashboard);
```

## Error Handling

The API includes comprehensive error handling for:
- Validation errors
- Duplicate email entries
- Database connection issues
- General server errors

All errors return appropriate HTTP status codes and descriptive messages. 