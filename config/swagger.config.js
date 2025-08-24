const swaggerJsdoc = require('swagger-jsdoc');

// Determine environment and set appropriate server URLs
const isDevelopment = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
const isProduction = process.env.NODE_ENV === 'production';

const getServers = () => {
    const servers = [];

    if (isDevelopment) {
        servers.push({
            url: `http://localhost:${process.env.PORT || 3000}/api`,
            description: 'Development server'
        });
    }

    if (isProduction || process.env.PRODUCTION_URL) {
        servers.push({
            url: process.env.PRODUCTION_URL || 'http://103.168.18.34:3000/api',
            description: 'Production server'
        });
    }

    // Fallback - show both if environment is not set
    if (!isDevelopment && !isProduction) {
        servers.push(
            {
                url: `http://localhost:${process.env.PORT || 3000}/api`,
                description: 'Development server'
            },
            {
                url: 'http://103.168.18.34:3000/api',
                description: 'Production server'
            }
        );
    }

    return servers;
};

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'BuddyDesk API',
            version: '1.0.0',
            description: 'Complete API for BuddyDesk platform including user authentication, profile management, and skills management.',
            contact: {
                name: 'API Support',
                email: 'support@buddydesk.com'
            },
            license: {
                name: 'ISC',
                url: 'https://opensource.org/licenses/ISC'
            }
        },
        servers: getServers(),
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'JWT token obtained from login endpoint'
                }
            },
            schemas: {
                User: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer', example: 1, description: 'User ID' },
                        name: { type: 'string', example: 'John Doe', description: 'User full name' },
                        email: { type: 'string', example: 'john.doe@example.com', description: 'User email address' },
                        created_at: { type: 'string', format: 'date-time', example: '2024-01-01T00:00:00.000Z', description: 'User creation timestamp' }
                    }
                },
                UserRegistration: {
                    type: 'object',
                    required: ['name', 'email', 'password'],
                    properties: {
                        name: { 
                            type: 'string', 
                            example: 'John Doe', 
                            description: 'User full name (2-50 characters, letters and spaces only)',
                            minLength: 2,
                            maxLength: 50
                        },
                        email: { 
                            type: 'string', 
                            example: 'john.doe@example.com', 
                            description: 'User email address (must be unique)',
                            format: 'email',
                            maxLength: 255
                        },
                        password: { 
                            type: 'string', 
                            example: 'TestPass123!', 
                            description: 'Password (8-128 characters, must contain uppercase, lowercase, number, and special character)',
                            minLength: 8,
                            maxLength: 128
                        }
                    }
                },
                UserLogin: {
                    type: 'object',
                    required: ['email', 'password'],
                    properties: {
                        email: { 
                            type: 'string', 
                            example: 'john.doe@example.com', 
                            description: 'User email address',
                            format: 'email',
                            maxLength: 255
                        },
                        password: { 
                            type: 'string', 
                            example: 'TestPass123!', 
                            description: 'User password',
                            minLength: 1
                        }
                    }
                },
                LoginResponse: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: true },
                        message: { type: 'string', example: 'Login successful' },
                        access_token: { 
                            type: 'string', 
                            example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                            description: 'Access token (15 minutes expiry)'
                        }
                    }
                },
                ValidationError: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: false },
                        message: { type: 'string', example: 'Validation failed' },
                        errors: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    field: { type: 'string', example: 'email' },
                                    message: { type: 'string', example: 'Please provide a valid email address' },
                                    value: { type: 'string', example: 'invalid-email' }
                                }
                            }
                        }
                    }
                },
                Error: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: false, description: 'Operation status flag' },
                        error: { type: 'string', description: 'Error details (only in development)', nullable: true },
                        message: { type: 'string', description: 'Error message' }
                    }
                },
                Skill: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer', example: 1, description: 'Skill ID' },
                        name: { type: 'string', example: 'Programming', description: 'Skill name' },
                        description: { type: 'string', example: 'Software development skills', description: 'Skill description' },
                        subSkills: {
                            type: 'array',
                            items: {
                                $ref: '#/components/schemas/SubSkill'
                            },
                            description: 'List of sub-skills associated with this skill'
                        }
                    }
                },
                SubSkill: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer', example: 1, description: 'Sub-skill ID' },
                        name: { type: 'string', example: 'JavaScript', description: 'Sub-skill name' },
                        description: { type: 'string', example: 'Web development language', description: 'Sub-skill description' },
                        skill_id: { type: 'integer', example: 1, description: 'Parent skill ID' },
                        skill: {
                            $ref: '#/components/schemas/Skill',
                            description: 'Parent skill information'
                        }
                    }
                },
                SkillsResponse: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: true },
                        message: { type: 'string', example: 'Skills retrieved successfully' },
                        data: {
                            type: 'array',
                            items: {
                                $ref: '#/components/schemas/Skill'
                            }
                        }
                    }
                },
                Conversation: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer', example: 1, description: 'Unique identifier for the conversation' },
                        type: { type: 'string', enum: ['private', 'group'], description: 'Type of conversation' },
                        name: { type: 'string', example: 'Project Team', description: 'Name of the conversation (for group chats)' },
                        description: { type: 'string', example: 'Discussion about project updates', description: 'Description of the conversation' },
                        avatar_url: { type: 'string', example: 'https://example.com/avatar.jpg', description: 'Avatar URL for the conversation' },
                        created_by: { type: 'integer', example: 1, description: 'ID of the user who created the conversation' },
                        is_active: { type: 'boolean', example: true, description: 'Whether the conversation is active' },
                        last_message_at: { type: 'string', format: 'date-time', example: '2024-01-01T12:00:00.000Z', description: 'Timestamp of the last message' },
                        created_at: { type: 'string', format: 'date-time', example: '2024-01-01T00:00:00.000Z', description: 'Creation timestamp' },
                        updated_at: { type: 'string', format: 'date-time', example: '2024-01-01T00:00:00.000Z', description: 'Last update timestamp' }
                    }
                },
                Message: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer', example: 1, description: 'Unique identifier for the message' },
                        conversation_id: { type: 'integer', example: 1, description: 'ID of the conversation this message belongs to' },
                        sender_id: { type: 'integer', example: 1, description: 'ID of the user who sent the message' },
                        content: { type: 'string', example: 'Hello, how are you?', description: 'Message content (decrypted)' },
                        message_type: { type: 'string', enum: ['text', 'image', 'video', 'audio', 'file', 'system'], description: 'Type of message' },
                        attachment_url: { type: 'string', example: 'https://example.com/file.pdf', description: 'URL of attached file' },
                        attachment_name: { type: 'string', example: 'document.pdf', description: 'Name of attached file' },
                        attachment_size: { type: 'integer', example: 1024, description: 'Size of attached file in bytes' },
                        attachment_mime_type: { type: 'string', example: 'application/pdf', description: 'MIME type of attached file' },
                        reply_to_message_id: { type: 'integer', example: 5, description: 'ID of the message this is replying to' },
                        forward_from_message_id: { type: 'integer', example: 3, description: 'ID of the original message if this is a forward' },
                        is_edited: { type: 'boolean', example: false, description: 'Whether the message has been edited' },
                        is_deleted: { type: 'boolean', example: false, description: 'Whether the message has been deleted' },
                        deleted_at: { type: 'string', format: 'date-time', example: null, description: 'Deletion timestamp' },
                        metadata: { type: 'object', example: {}, description: 'Additional message metadata' },
                        created_at: { type: 'string', format: 'date-time', example: '2024-01-01T12:00:00.000Z', description: 'Creation timestamp' },
                        updated_at: { type: 'string', format: 'date-time', example: '2024-01-01T12:00:00.000Z', description: 'Last update timestamp' }
                    }
                },
                CreateConversationRequest: {
                    type: 'object',
                    required: ['type'],
                    properties: {
                        type: { type: 'string', enum: ['private', 'group'], description: 'Type of conversation to create' },
                        name: { type: 'string', example: 'Project Team', description: 'Name for group conversations' },
                        description: { type: 'string', example: 'Discussion about project updates', description: 'Description for group conversations' },
                        avatar_url: { type: 'string', example: 'https://example.com/avatar.jpg', description: 'Avatar URL for the conversation' },
                        participant_ids: { type: 'array', items: { type: 'integer' }, example: [2, 3], description: 'Array of user IDs to add to the conversation' }
                    }
                },
                SendMessageRequest: {
                    type: 'object',
                    required: ['content'],
                    properties: {
                        content: { type: 'string', example: 'Hello, how are you?', description: 'Message content' },
                        message_type: { type: 'string', enum: ['text', 'image', 'video', 'audio', 'file'], default: 'text', description: 'Type of message' },
                        reply_to_message_id: { type: 'integer', example: 5, description: 'ID of the message to reply to' },
                        forward_from_message_id: { type: 'integer', example: 3, description: 'ID of the message to forward' },
                        metadata: { type: 'object', example: {}, description: 'Additional message metadata' }
                    }
                },
                ConversationResponse: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: true },
                        message: { type: 'string', example: 'Conversation created successfully' },
                        data: { $ref: '#/components/schemas/Conversation' }
                    }
                },
                MessageResponse: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: true },
                        message: { type: 'string', example: 'Message sent successfully' },
                        data: { $ref: '#/components/schemas/Message' }
                    }
                },
                ConversationsListResponse: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: true },
                        message: { type: 'string', example: 'Conversations retrieved successfully' },
                        data: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/Conversation' }
                        },
                        pagination: {
                            type: 'object',
                            properties: {
                                page: { type: 'integer', example: 1 },
                                limit: { type: 'integer', example: 20 },
                                total: { type: 'integer', example: 50 },
                                totalPages: { type: 'integer', example: 3 }
                            }
                        }
                    }
                },
                MessagesListResponse: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: true },
                        message: { type: 'string', example: 'Messages retrieved successfully' },
                        data: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/Message' }
                        },
                        pagination: {
                            type: 'object',
                            properties: {
                                page: { type: 'integer', example: 1 },
                                limit: { type: 'integer', example: 50 },
                                total: { type: 'integer', example: 100 },
                                totalPages: { type: 'integer', example: 2 }
                            }
                        }
                    }
                },
                Notification: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer', example: 1, description: 'Unique identifier for the notification' },
                        user_id: { type: 'integer', example: 1, description: 'ID of the user receiving the notification' },
                        message_id: { type: 'integer', example: 1, description: 'ID of the related message' },
                        conversation_id: { type: 'integer', example: 1, description: 'ID of the related conversation' },
                        type: { type: 'string', enum: ['message', 'mention', 'group_invite', 'system'], description: 'Type of notification' },
                        title: { type: 'string', example: 'New Message', description: 'Notification title' },
                        body: { type: 'string', example: 'You have a new message from John', description: 'Notification body' },
                        data: { type: 'object', example: {}, description: 'Additional notification data' },
                        is_seen: { type: 'boolean', example: false, description: 'Whether the notification has been seen' },
                        is_read: { type: 'boolean', example: false, description: 'Whether the notification has been read' },
                        seen_at: { type: 'string', format: 'date-time', example: null, description: 'Timestamp when notification was seen' },
                        read_at: { type: 'string', format: 'date-time', example: null, description: 'Timestamp when notification was read' },
                        created_at: { type: 'string', format: 'date-time', example: '2024-01-01T12:00:00.000Z', description: 'Creation timestamp' }
                    }
                },
                NotificationsResponse: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: true },
                        message: { type: 'string', example: 'Notifications retrieved successfully' },
                        data: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/Notification' }
                        },
                        pagination: {
                            type: 'object',
                            properties: {
                                page: { type: 'integer', example: 1 },
                                limit: { type: 'integer', example: 20 },
                                total: { type: 'integer', example: 10 },
                                totalPages: { type: 'integer', example: 1 }
                            }
                        }
                    }
                },
                SubSkillsResponse: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: true },
                        message: { type: 'string', example: 'Sub-skills retrieved successfully' },
                        data: {
                            type: 'array',
                            items: {
                                $ref: '#/components/schemas/SubSkill'
                            }
                        }
                    }
                },
                UserProfile: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer', example: 1, description: 'Profile ID' },
                        phone: { type: 'string', example: '+1234567890', description: 'Phone number' },
                        dob: { type: 'string', format: 'date', example: '1990-01-01', description: 'Date of birth' },
                        gender: { type: 'string', enum: ['Male', 'Female', 'Other'], example: 'Male', description: 'Gender' },
                        created_at: { type: 'string', format: 'date-time', example: '2024-01-01T00:00:00.000Z' },
                        updated_at: { type: 'string', format: 'date-time', example: '2024-01-01T00:00:00.000Z' }
                    }
                },
                WorkProfile: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer', example: 1, description: 'Work profile ID' },
                        company_name: { type: 'string', example: 'Tech Corp', description: 'Company name' },
                        designation: { type: 'string', example: 'Senior Developer', description: 'Job designation' },
                        start_date: { type: 'string', format: 'date', example: '2022-01-01', description: 'Employment start date' },
                        end_date: { type: 'string', format: 'date', example: '2024-01-01', description: 'Employment end date (null if current)', nullable: true },
                        created_at: { type: 'string', format: 'date-time', example: '2024-01-01T00:00:00.000Z' },
                        updated_at: { type: 'string', format: 'date-time', example: '2024-01-01T00:00:00.000Z' }
                    }
                },
                UserSkill: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer', example: 1, description: 'User skill ID' },
                        proficiency_level: { type: 'string', enum: ['Beginner', 'Intermediate', 'Expert'], example: 'Intermediate', description: 'Skill proficiency level' },
                        created_at: { type: 'string', format: 'date-time', example: '2024-01-01T00:00:00.000Z' },
                        updated_at: { type: 'string', format: 'date-time', example: '2024-01-01T00:00:00.000Z' },
                        skill: {
                            type: 'object',
                            properties: {
                                id: { type: 'integer', example: 1, description: 'Skill ID' },
                                name: { type: 'string', example: 'Programming', description: 'Skill name' },
                                description: { type: 'string', example: 'Software development skills', description: 'Skill description' }
                            }
                        },
                        subSkill: {
                            type: 'object',
                            properties: {
                                id: { type: 'integer', example: 1, description: 'Sub-skill ID' },
                                name: { type: 'string', example: 'JavaScript', description: 'Sub-skill name' },
                                description: { type: 'string', example: 'Web development language', description: 'Sub-skill description' }
                            },
                            nullable: true
                        }
                    }
                },
                Address: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer', example: 1, description: 'Address ID' },
                        street: { type: 'string', example: '123 Main St', description: 'Street address' },
                        city: { type: 'string', example: 'New York', description: 'City' },
                        state: { type: 'string', example: 'NY', description: 'State/Province' },
                        zip_code: { type: 'string', example: '10001', description: 'ZIP/Postal code' },
                        country: { type: 'string', example: 'USA', description: 'Country' },
                        type: { type: 'string', enum: ['home', 'office'], example: 'home', description: 'Address type' },
                        created_at: { type: 'string', format: 'date-time', example: '2024-01-01T00:00:00.000Z' },
                        updated_at: { type: 'string', format: 'date-time', example: '2024-01-01T00:00:00.000Z' }
                    }
                },
                TempAddress: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer', example: 1, description: 'Temporary address ID' },
                        location_data: { type: 'string', example: 'GPS: 28.6139,77.2090', description: 'Raw location data or notes' },
                        pincode: { type: 'string', example: '110001', description: '6-digit pincode' },
                        selected_area: { type: 'string', example: 'Connaught Place', description: 'Selected locality/area' },
                        city: { type: 'string', example: 'New Delhi', description: 'City', nullable: true },
                        state: { type: 'string', example: 'Delhi', description: 'State/Province', nullable: true },
                        country: { type: 'string', example: 'India', description: 'Country', nullable: true },
                        location_permission: { type: 'boolean', example: true, description: 'Whether user granted location permission' },
                        is_active: { type: 'boolean', example: true, description: 'Whether temp address is currently active' },
                        expires_at: { type: 'string', format: 'date-time', example: '2024-02-01T00:00:00.000Z', description: 'Expiration timestamp', nullable: true },
                        created_at: { type: 'string', format: 'date-time', example: '2024-01-01T00:00:00.000Z' },
                        updated_at: { type: 'string', format: 'date-time', example: '2024-01-01T00:00:00.000Z' }
                    }
                },
                PostAttachment: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer', example: 1, description: 'Attachment ID' },
                        file_path: { type: 'string', example: '/uploads/documents/file.pdf', description: 'File path' },
                        file_name: { type: 'string', example: 'document.pdf', description: 'Original file name' },
                        mime_type: { type: 'string', example: 'application/pdf', description: 'MIME type' },
                        uploaded_at: { type: 'string', format: 'date-time', example: '2024-01-01T00:00:00.000Z' }
                    }
                },
                Post: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer', example: 1, description: 'Post ID' },
                        title: { type: 'string', example: 'Need help with React project', description: 'Post title' },
                        description: { type: 'string', example: 'Looking for someone to help with a React.js project...', description: 'Post description' },
                        medium: { type: 'string', enum: ['online', 'offline'], example: 'online', description: 'Collaboration medium' },
                        status: { type: 'string', enum: ['active', 'hold', 'discussed', 'completed', 'deleted'], example: 'active', description: 'Post status' },
                        deadline: { type: 'string', format: 'date', example: '2024-02-01', description: 'Project deadline', nullable: true },
                        created_at: { type: 'string', format: 'date-time', example: '2024-01-01T00:00:00.000Z' },
                        updated_at: { type: 'string', format: 'date-time', example: '2024-01-01T00:00:00.000Z' },
                        requiredSkill: {
                            type: 'object',
                            properties: {
                                id: { type: 'integer', example: 1, description: 'Required skill ID' },
                                name: { type: 'string', example: 'Programming', description: 'Required skill name' },
                                description: { type: 'string', example: 'Software development skills', description: 'Required skill description' }
                            },
                            nullable: true
                        },
                        requiredSubSkill: {
                            type: 'object',
                            properties: {
                                id: { type: 'integer', example: 1, description: 'Required sub-skill ID' },
                                name: { type: 'string', example: 'React.js', description: 'Required sub-skill name' },
                                description: { type: 'string', example: 'React JavaScript library', description: 'Required sub-skill description' }
                            },
                            nullable: true
                        },
                        attachments: {
                            type: 'array',
                            items: {
                                $ref: '#/components/schemas/PostAttachment'
                            },
                            description: 'Post attachments'
                        }
                    }
                },
                PostCreation: {
                    type: 'object',
                    properties: {
                        title: { 
                            type: 'string', 
                            example: 'Need help with React project', 
                            description: 'Post title (optional, 1-255 characters)',
                            minLength: 1,
                            maxLength: 255
                        },
                        description: { 
                            type: 'string', 
                            example: 'Looking for someone to help with a React.js project involving state management and API integration.', 
                            description: 'Post description (optional, 1-5000 characters)',
                            minLength: 1,
                            maxLength: 5000
                        },
                        required_skill_id: { 
                            type: 'integer', 
                            example: 1, 
                            description: 'Required skill ID (optional, positive integer)',
                            minimum: 1,
                            nullable: true
                        },
                        required_sub_skill_id: { 
                            type: 'integer', 
                            example: 2, 
                            description: 'Required sub-skill ID (optional, positive integer)',
                            minimum: 1,
                            nullable: true
                        },
                        medium: { 
                            type: 'string', 
                            enum: ['online', 'offline'], 
                            example: 'online', 
                            description: 'Collaboration medium (optional, defaults to online)'
                        },
                        deadline: { 
                            type: 'string', 
                            format: 'date', 
                            example: '2024-12-31', 
                            description: 'Project deadline (optional, must be future date)',
                            nullable: true
                        }
                    },
                    additionalProperties: false
                },
                PostResponse: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: true },
                        message: { type: 'string', example: 'Post created successfully' },
                        data: {
                            $ref: '#/components/schemas/Post'
                        }
                    }
                },
                PostsResponse: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: true },
                        message: { type: 'string', example: 'Posts retrieved successfully' },
                        data: {
                            type: 'array',
                            items: {
                                $ref: '#/components/schemas/Post'
                            }
                        },
                        pagination: {
                            type: 'object',
                            properties: {
                                currentPage: { type: 'integer', example: 1 },
                                totalPages: { type: 'integer', example: 5 },
                                totalItems: { type: 'integer', example: 47 },
                                itemsPerPage: { type: 'integer', example: 10 }
                            }
                        }
                    }
                },
                PostUpdate: {
                    type: 'object',
                    properties: {
                        title: { 
                            type: 'string', 
                            example: 'Updated: Need help with React project', 
                            description: 'Post title (optional, 1-255 characters)',
                            minLength: 1,
                            maxLength: 255
                        },
                        description: { 
                            type: 'string', 
                            example: 'Updated description: Looking for an experienced React.js developer for a complex project.', 
                            description: 'Post description (optional, 1-5000 characters)',
                            minLength: 1,
                            maxLength: 5000
                        },
                        required_skill_id: { 
                            type: 'integer', 
                            example: 2, 
                            description: 'Required skill ID (optional, positive integer)',
                            minimum: 1,
                            nullable: true
                        },
                        required_sub_skill_id: { 
                            type: 'integer', 
                            example: 3, 
                            description: 'Required sub-skill ID (optional, positive integer)',
                            minimum: 1,
                            nullable: true
                        },
                        medium: { 
                            type: 'string', 
                            enum: ['online', 'offline'], 
                            example: 'offline', 
                            description: 'Collaboration medium (optional)'
                        },
                        status: { 
                            type: 'string', 
                            enum: ['active', 'hold', 'discussed', 'completed', 'deleted'], 
                            example: 'hold', 
                            description: 'Post status (optional)'
                        },
                        deadline: { 
                            type: 'string', 
                            format: 'date', 
                            example: '2025-01-15', 
                            description: 'Project deadline (optional, can be null to clear deadline)',
                            nullable: true
                        }
                    },
                    additionalProperties: false
                },
                EnhancedWorkProfile: {
                    type: 'object',
                    allOf: [
                        {
                            $ref: '#/components/schemas/WorkProfile'
                        },
                        {
                            type: 'object',
                            properties: {
                                userSkills: {
                                    type: 'array',
                                    items: {
                                        $ref: '#/components/schemas/UserSkill'
                                    },
                                    description: 'Skills associated with this work profile'
                                }
                            }
                        }
                    ]
                },
                CompleteProfile: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer', example: 1, description: 'User ID' },
                        name: { type: 'string', example: 'John Doe', description: 'User full name' },
                        email: { type: 'string', example: 'john.doe@example.com', description: 'User email address' },
                        created_at: { type: 'string', format: 'date-time', example: '2024-01-01T00:00:00.000Z' },
                        updated_at: { type: 'string', format: 'date-time', example: '2024-01-01T00:00:00.000Z' },
                        profile: {
                            $ref: '#/components/schemas/UserProfile',
                            description: 'User personal profile information'
                        },
                        work_profiles: {
                            type: 'array',
                            items: {
                                $ref: '#/components/schemas/EnhancedWorkProfile'
                            },
                            description: 'User work experience profiles with skills'
                        },
                        addresses: {
                            type: 'array',
                            items: {
                                $ref: '#/components/schemas/Address'
                            },
                            description: 'User addresses'
                        },
                        temp_addresses: {
                            type: 'array',
                            items: {
                                $ref: '#/components/schemas/TempAddress'
                            },
                            description: 'User temporary addresses'
                        },
                        posts: {
                            type: 'array',
                            items: {
                                $ref: '#/components/schemas/Post'
                            },
                            description: 'User posts'
                        }
                    }
                },
                ProfileResponse: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: true },
                        message: { type: 'string', example: 'Profile retrieved successfully' },
                        data: {
                            $ref: '#/components/schemas/CompleteProfile'
                        }
                    }
                },
                UpdateProfileResponse: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: true },
                        message: { type: 'string', example: 'Profile updated successfully' },
                        data: {
                            type: 'object',
                            properties: {
                                id: { type: 'integer', example: 1, description: 'User ID' },
                                name: { type: 'string', example: 'John Doe', description: 'User full name' },
                                email: { type: 'string', example: 'john.doe@example.com', description: 'User email address' },
                                created_at: { type: 'string', format: 'date-time', example: '2024-01-01T00:00:00.000Z' },
                                updated_at: { type: 'string', format: 'date-time', example: '2024-01-15T10:30:00.000Z' },
                                profile: {
                                    type: 'object',
                                    properties: {
                                        id: { type: 'integer', example: 1, description: 'Profile ID' },
                                        phone: { type: 'string', example: '+1234567890', description: 'Phone number', nullable: true },
                                        dob: { type: 'string', format: 'date', example: '1990-01-01', description: 'Date of birth', nullable: true },
                                        gender: { type: 'string', enum: ['Male', 'Female', 'Other'], example: 'Male', description: 'Gender', nullable: true },
                                        created_at: { type: 'string', format: 'date-time', example: '2024-01-01T00:00:00.000Z' },
                                        updated_at: { type: 'string', format: 'date-time', example: '2024-01-15T10:30:00.000Z' }
                                    },
                                    nullable: true
                                }
                            }
                        }
                    }
                },
                UpdateProfileRequest: {
                    type: 'object',
                    properties: {
                        name: { 
                            type: 'string', 
                            example: 'John Doe', 
                            description: 'User full name (2-50 characters, letters and spaces only)',
                            minLength: 2,
                            maxLength: 50
                        },
                        email: { 
                            type: 'string', 
                            example: 'john.doe@example.com', 
                            description: 'User email address (must be unique)',
                            format: 'email',
                            maxLength: 255
                        },
                        phone: { 
                            type: 'string', 
                            example: '+1234567890', 
                            description: 'Phone number (10-20 characters)',
                            minLength: 10,
                            maxLength: 20
                        },
                        dob: { 
                            type: 'string', 
                            format: 'date', 
                            example: '1990-01-01', 
                            description: 'Date of birth in YYYY-MM-DD format (must be at least 13 years old and not more than 120 years ago)'
                        }
                    },
                    additionalProperties: false,
                    description: 'At least one field must be provided. All fields are optional but cannot be empty, null, or undefined if provided.'
                },
                PublicProfile: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer', example: 1, description: 'User ID' },
                        name: { type: 'string', example: 'John Doe', description: 'User full name' },
                        member_since: { type: 'string', format: 'date-time', example: '2024-01-01T00:00:00.000Z', description: 'Member since date' },
                        profile: {
                            type: 'object',
                            properties: {
                                gender: { type: 'string', enum: ['Male', 'Female', 'Other'], example: 'Male', description: 'Gender (limited public info)', nullable: true }
                            },
                            description: 'Limited public profile information'
                        },
                        work_experience: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    company_name: { type: 'string', example: 'Tech Corp', description: 'Company name' },
                                    designation: { type: 'string', example: 'Senior Developer', description: 'Job designation' },
                                    start_date: { type: 'string', format: 'date', example: '2022-01-01', description: 'Employment start date' },
                                    end_date: { type: 'string', format: 'date', example: '2024-01-01', description: 'Employment end date', nullable: true },
                                    duration: { type: 'string', example: '2 years 3 months', description: 'Calculated work duration' }
                                }
                            },
                            description: 'Public work experience information'
                        }
                    }
                },
                PublicProfileResponse: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: true },
                        message: { type: 'string', example: 'Public profile retrieved successfully' },
                        data: {
                            $ref: '#/components/schemas/PublicProfile'
                        }
                    }
                },
                // Aadhaar Verification Schemas
                AadhaarXMLVerificationRequest: {
                    type: 'object',
                    required: ['xmlData', 'shareCode'],
                    properties: {
                        xmlData: {
                            type: 'string',
                            description: 'Base64 encoded XML data from Aadhaar',
                            example: 'UDdGa1pT...base64_encoded_xml_data'
                        },
                        shareCode: {
                            type: 'string',
                            pattern: '^[0-9]{4}$',
                            description: '4-digit share code for decryption',
                            example: '1234'
                        }
                    }
                },
                AadhaarNumberValidationRequest: {
                    type: 'object',
                    required: ['aadhaarNumber'],
                    properties: {
                        aadhaarNumber: {
                            type: 'string',
                            pattern: '^[0-9]{4}\\s?[0-9]{4}\\s?[0-9]{4}$',
                            description: '12-digit Aadhaar number (with or without spaces)',
                            example: '1234 5678 9012'
                        }
                    }
                },
                AadhaarVerificationResult: {
                    type: 'object',
                    properties: {
                        success: {
                            type: 'boolean',
                            example: true
                        },
                        requestId: {
                            type: 'string',
                            format: 'uuid',
                            example: 'req-12345-uuid'
                        },
                        verificationId: {
                            type: 'string',
                            format: 'uuid',
                            example: 'verification-12345-uuid'
                        },
                        data: {
                            type: 'object',
                            properties: {
                                name: { type: 'string', example: 'John Doe' },
                                dateOfBirth: { type: 'string', example: '01-01-1990' },
                                gender: { type: 'string', example: 'M' },
                                phone: { type: 'string', example: '9876543210' },
                                email: { type: 'string', example: 'john@example.com' },
                                maskedAadhaarNumber: { type: 'string', example: 'XXXX XXXX 1234' },
                                address: {
                                    type: 'object',
                                    properties: {
                                        careOf: { type: 'string', example: 'S/O ABC' },
                                        house: { type: 'string', example: '123' },
                                        street: { type: 'string', example: 'Main Street' },
                                        locality: { type: 'string', example: 'Downtown' },
                                        district: { type: 'string', example: 'Example District' },
                                        state: { type: 'string', example: 'Example State' },
                                        pincode: { type: 'string', example: '123456' }
                                    }
                                }
                            }
                        },
                        signatureValid: {
                            type: 'boolean',
                            example: true
                        },
                        timestampValid: {
                            type: 'boolean',
                            example: true
                        },
                        checksumValid: {
                            type: 'boolean',
                            example: true
                        },
                        verificationTime: {
                            type: 'string',
                            format: 'date-time',
                            example: '2024-01-15T10:30:00.000Z'
                        }
                    }
                },
                AadhaarVerificationHistory: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: true },
                        requestId: { type: 'string', format: 'uuid' },
                        data: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    id: { type: 'string', format: 'uuid' },
                                    verificationId: { type: 'string', format: 'uuid' },
                                    verificationType: { type: 'string', enum: ['XML', 'QR', 'NUMBER'] },
                                    verificationStatus: { type: 'string', enum: ['SUCCESS', 'FAILED', 'PENDING'] },
                                    maskedAadhaarNumber: { type: 'string', example: 'XXXX XXXX 1234' },
                                    signatureValid: { type: 'boolean', nullable: true },
                                    timestampValid: { type: 'boolean', nullable: true },
                                    checksumValid: { type: 'boolean', nullable: true },
                                    verificationTime: { type: 'string', format: 'date-time' },
                                    createdAt: { type: 'string', format: 'date-time' }
                                }
                            }
                        },
                        total: { type: 'integer', example: 25 },
                        limit: { type: 'integer', example: 10 },
                        offset: { type: 'integer', example: 0 }
                    }
                },
                AadhaarErrorResponse: {
                    type: 'object',
                    properties: {
                        success: {
                            type: 'boolean',
                            example: false
                        },
                        requestId: {
                            type: 'string',
                            format: 'uuid'
                        },
                        message: {
                            type: 'string',
                            example: 'Validation failed'
                        },
                        error: {
                            type: 'string',
                            example: 'Invalid XML format'
                        },
                        errors: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    field: { type: 'string', example: 'xmlData' },
                                    message: { type: 'string', example: 'XML data is required' }
                                }
                            }
                        }
                    }
                }
            }
        },
        tags: [
            {
                name: 'Users',
                description: 'User management operations'
            },
            {
                name: 'Skills',
                description: 'Skills and sub-skills management operations'
            },
            {
                name: 'Posts',
                description: 'Post management operations'
            },
            {
                name: 'Aadhaar Verification',
                description: 'Offline Aadhaar verification APIs'
            }
        ],
        paths: {
            '/users/register': {
                post: {
                    summary: 'Register a new user',
                    description: 'Create a new user account with validation',
                    tags: ['Users'],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: '#/components/schemas/UserRegistration'
                                },
                                examples: {
                                    valid: {
                                        summary: 'Valid registration',
                                        value: {
                                            name: 'John Doe',
                                            email: 'john.doe@example.com',
                                            password: 'TestPass123!'
                                        }
                                    },
                                    invalid_name: {
                                        summary: 'Invalid name (too short)',
                                        value: {
                                            name: 'J',
                                            email: 'john.doe@example.com',
                                            password: 'TestPass123!'
                                        }
                                    },
                                    invalid_email: {
                                        summary: 'Invalid email format',
                                        value: {
                                            name: 'John Doe',
                                            email: 'invalid-email',
                                            password: 'TestPass123!'
                                        }
                                    },
                                    invalid_password: {
                                        summary: 'Invalid password (missing special character)',
                                        value: {
                                            name: 'John Doe',
                                            email: 'john.doe@example.com',
                                            password: 'TestPass123'
                                        }
                                    }
                                }
                            }
                        }
                    },
                    responses: {
                        '201': {
                            description: 'User registered successfully',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            success: {
                                                type: 'boolean',
                                                example: true
                                            },
                                            message: {
                                                type: 'string',
                                                example: 'User registered successfully'
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        '400': {
                            description: 'Validation error',
                            content: {
                                'application/json': {
                                    schema: {
                                        $ref: '#/components/schemas/ValidationError'
                                    },
                                    examples: {
                                        name_validation: {
                                            summary: 'Name validation error',
                                            value: {
                                                success: false,
                                                message: 'Validation failed',
                                                errors: [
                                                    {
                                                        field: 'name',
                                                        message: 'Name must be between 2 and 50 characters',
                                                        value: 'J'
                                                    }
                                                ]
                                            }
                                        },
                                        email_validation: {
                                            summary: 'Email validation error',
                                            value: {
                                                success: false,
                                                message: 'Validation failed',
                                                errors: [
                                                    {
                                                        field: 'email',
                                                        message: 'Please provide a valid email address',
                                                        value: 'invalid-email'
                                                    }
                                                ]
                                            }
                                        },
                                        password_validation: {
                                            summary: 'Password validation error',
                                            value: {
                                                success: false,
                                                message: 'Validation failed',
                                                errors: [
                                                    {
                                                        field: 'password',
                                                        message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
                                                        value: 'weak'
                                                    }
                                                ]
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        '409': {
                            description: 'User with this email already exists',
                            content: {
                                'application/json': {
                                    schema: {
                                        $ref: '#/components/schemas/Error'
                                    },
                                    example: {
                                        success: false,
                                        message: 'User with this email already exists'
                                    }
                                }
                            }
                        },
                        '500': {
                            description: 'Internal server error',
                            content: {
                                'application/json': {
                                    schema: {
                                        $ref: '#/components/schemas/Error'
                                    }
                                }
                            }
                        }
                    }
                }
            },
            '/users/login': {
                post: {
                    summary: 'Login user',
                    description: 'Authenticate user with email and password',
                    tags: ['Users'],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: '#/components/schemas/UserLogin'
                                },
                                examples: {
                                    valid: {
                                        summary: 'Valid login',
                                        value: {
                                            email: 'john.doe@example.com',
                                            password: 'TestPass123!'
                                        }
                                    },
                                    invalid_email: {
                                        summary: 'Invalid email format',
                                        value: {
                                            email: 'invalid-email',
                                            password: 'TestPass123!'
                                        }
                                    },
                                    missing_password: {
                                        summary: 'Missing password',
                                        value: {
                                            email: 'john.doe@example.com'
                                        }
                                    }
                                }
                            }
                        }
                    },
                    responses: {
                        '200': {
                            description: 'Login successful',
                            content: {
                                'application/json': {
                                    schema: {
                                        $ref: '#/components/schemas/LoginResponse'
                                    }
                                }
                            }
                        },
                        '400': {
                            description: 'Validation error',
                            content: {
                                'application/json': {
                                    schema: {
                                        $ref: '#/components/schemas/ValidationError'
                                    }
                                }
                            }
                        },
                        '401': {
                            description: 'Invalid credentials',
                            content: {
                                'application/json': {
                                    schema: {
                                        $ref: '#/components/schemas/Error'
                                    },
                                    example: {
                                        success: false,
                                        message: 'Invalid email or password'
                                    }
                                }
                            }
                        },
                        '500': {
                            description: 'Internal server error',
                            content: {
                                'application/json': {
                                    schema: {
                                        $ref: '#/components/schemas/Error'
                                    }
                                }
                            }
                        }
                    }
                }
            },
            '/users/refresh-token': {
                post: {
                    summary: 'Refresh access token',
                    description: 'Get a new access token using refresh token from cookie',
                    tags: ['Users'],
                    responses: {
                        '200': {
                            description: 'Token refreshed successfully',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            success: {
                                                type: 'boolean',
                                                example: true
                                            },
                                            message: {
                                                type: 'string',
                                                example: 'Token refreshed successfully'
                                            },
                                            data: {
                                                type: 'object',
                                                properties: {
                                                    accessToken: {
                                                        type: 'string',
                                                        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                                                        description: 'New access token (15 minutes expiry)'
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        '401': {
                            description: 'Invalid or expired refresh token',
                            content: {
                                'application/json': {
                                    schema: {
                                        $ref: '#/components/schemas/Error'
                                    }
                                }
                            }
                        },
                        '500': {
                            description: 'Internal server error',
                            content: {
                                'application/json': {
                                    schema: {
                                        $ref: '#/components/schemas/Error'
                                    }
                                }
                            }
                        }
                    }
                }
            },
            '/users/logout': {
                post: {
                    summary: 'Logout user',
                    description: 'Logout user and invalidate tokens',
                    tags: ['Users'],
                    security: [
                        {
                            bearerAuth: []
                        }
                    ],
                    responses: {
                        '200': {
                            description: 'Logout successful',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            success: {
                                                type: 'boolean',
                                                example: true
                                            },
                                            message: {
                                                type: 'string',
                                                example: 'Logout successful'
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        '401': {
                            description: 'Unauthorized',
                            content: {
                                'application/json': {
                                    schema: {
                                        $ref: '#/components/schemas/Error'
                                    }
                                }
                            }
                        },
                        '500': {
                            description: 'Internal server error',
                            content: {
                                'application/json': {
                                    schema: {
                                        $ref: '#/components/schemas/Error'
                                    }
                                }
                            }
                        }
                    }
                }
            },
            '/skills': {
                get: {
                    summary: 'Get all skills with sub-skills',
                    description: 'Retrieve all skills along with their associated sub-skills',
                    tags: ['Skills'],
                    security: [
                        {
                            bearerAuth: []
                        }
                    ],
                    responses: {
                        '200': {
                            description: 'Skills retrieved successfully',
                            content: {
                                'application/json': {
                                    schema: {
                                        $ref: '#/components/schemas/SkillsResponse'
                                    },
                                    example: {
                                        success: true,
                                        message: 'Skills retrieved successfully',
                                        data: [
                                            {
                                                id: 1,
                                                name: 'Programming',
                                                description: 'Software development skills',
                                                subSkills: [
                                                    {
                                                        id: 1,
                                                        name: 'JavaScript',
                                                        description: 'Web development language'
                                                    },
                                                    {
                                                        id: 2,
                                                        name: 'Python',
                                                        description: 'General-purpose programming language'
                                                    }
                                                ]
                                            },
                                            {
                                                id: 2,
                                                name: 'Design',
                                                description: 'Creative design skills',
                                                subSkills: [
                                                    {
                                                        id: 3,
                                                        name: 'UI/UX Design',
                                                        description: 'User interface and experience design'
                                                    }
                                                ]
                                            }
                                        ]
                                    }
                                }
                            }
                        },
                        '500': {
                            description: 'Internal server error',
                            content: {
                                'application/json': {
                                    schema: {
                                        $ref: '#/components/schemas/Error'
                                    }
                                }
                            }
                        }
                    }
                }
            },
            '/skills/{id}': {
                get: {
                    summary: 'Get skill by ID',
                    description: 'Retrieve a specific skill by ID along with its sub-skills',
                    tags: ['Skills'],
                    security: [
                        {
                            bearerAuth: []
                        }
                    ],
                    parameters: [
                        {
                            name: 'id',
                            in: 'path',
                            required: true,
                            description: 'Skill ID',
                            schema: {
                                type: 'integer',
                                example: 1
                            }
                        }
                    ],
                    responses: {
                        '200': {
                            description: 'Skill retrieved successfully',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            success: { type: 'boolean', example: true },
                                            message: { type: 'string', example: 'Skill retrieved successfully' },
                                            data: {
                                                $ref: '#/components/schemas/Skill'
                                            }
                                        }
                                    },
                                    example: {
                                        success: true,
                                        message: 'Skill retrieved successfully',
                                        data: {
                                            id: 1,
                                            name: 'Programming',
                                            description: 'Software development skills',
                                            subSkills: [
                                                {
                                                    id: 1,
                                                    name: 'JavaScript',
                                                    description: 'Web development language'
                                                },
                                                {
                                                    id: 2,
                                                    name: 'Python',
                                                    description: 'General-purpose programming language'
                                                }
                                            ]
                                        }
                                    }
                                }
                            }
                        },
                        '401': {
                            description: 'Unauthorized - Invalid or missing access token',
                            content: {
                                'application/json': {
                                    schema: {
                                        $ref: '#/components/schemas/Error'
                                    },
                                    examples: {
                                        missing_token: {
                                            summary: 'Missing access token',
                                            value: {
                                                success: false,
                                                message: 'Access token required'
                                            }
                                        },
                                        invalid_token: {
                                            summary: 'Invalid access token',
                                            value: {
                                                success: false,
                                                message: 'Invalid access token'
                                            }
                                        },
                                        expired_token: {
                                            summary: 'Expired access token',
                                            value: {
                                                success: false,
                                                message: 'Access token expired'
                                            }
                                        },
                                        revoked_token: {
                                            summary: 'Revoked access token',
                                            value: {
                                                success: false,
                                                message: 'Token has been revoked'
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        '404': {
                            description: 'Skill not found',
                            content: {
                                'application/json': {
                                    schema: {
                                        $ref: '#/components/schemas/Error'
                                    },
                                    example: {
                                        success: false,
                                        message: 'Skill not found'
                                    }
                                }
                            }
                        },
                        '401': {
                            description: 'Unauthorized - Invalid or missing access token',
                            content: {
                                'application/json': {
                                    schema: {
                                        $ref: '#/components/schemas/Error'
                                    },
                                    examples: {
                                        missing_token: {
                                            summary: 'Missing access token',
                                            value: {
                                                success: false,
                                                message: 'Access token required'
                                            }
                                        },
                                        invalid_token: {
                                            summary: 'Invalid access token',
                                            value: {
                                                success: false,
                                                message: 'Invalid access token'
                                            }
                                        },
                                        expired_token: {
                                            summary: 'Expired access token',
                                            value: {
                                                success: false,
                                                message: 'Access token expired'
                                            }
                                        },
                                        revoked_token: {
                                            summary: 'Revoked access token',
                                            value: {
                                                success: false,
                                                message: 'Token has been revoked'
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        '500': {
                            description: 'Internal server error',
                            content: {
                                'application/json': {
                                    schema: {
                                        $ref: '#/components/schemas/Error'
                                    }
                                }
                            }
                        }
                    }
                }
            },
            '/skills/sub-skills/all': {
                get: {
                    summary: 'Get all sub-skills',
                    description: 'Retrieve all sub-skills with their parent skill information',
                    tags: ['Skills'],
                    security: [
                        {
                            bearerAuth: []
                        }
                    ],
                    responses: {
                        '200': {
                            description: 'Sub-skills retrieved successfully',
                            content: {
                                'application/json': {
                                    schema: {
                                        $ref: '#/components/schemas/SubSkillsResponse'
                                    },
                                    example: {
                                        success: true,
                                        message: 'Sub-skills retrieved successfully',
                                        data: [
                                            {
                                                id: 1,
                                                name: 'JavaScript',
                                                description: 'Web development language',
                                                skill_id: 1,
                                                skill: {
                                                    id: 1,
                                                    name: 'Programming',
                                                    description: 'Software development skills'
                                                }
                                            },
                                            {
                                                id: 2,
                                                name: 'Python',
                                                description: 'General-purpose programming language',
                                                skill_id: 1,
                                                skill: {
                                                    id: 1,
                                                    name: 'Programming',
                                                    description: 'Software development skills'
                                                }
                                            }
                                        ]
                                    }
                                }
                            }
                        },
                        '500': {
                            description: 'Internal server error',
                            content: {
                                'application/json': {
                                    schema: {
                                        $ref: '#/components/schemas/Error'
                                    }
                                }
                            }
                        }
                    }
                }
            },
            '/skills/sub-skills/{skillId}': {
                get: {
                    summary: 'Get sub-skills by skill ID',
                    description: 'Retrieve all sub-skills for a specific skill ID',
                    tags: ['Skills'],
                    security: [
                        {
                            bearerAuth: []
                        }
                    ],
                    parameters: [
                        {
                            name: 'skillId',
                            in: 'path',
                            required: true,
                            description: 'Skill ID to get sub-skills for',
                            schema: {
                                type: 'integer',
                                example: 1
                            }
                        }
                    ],
                    responses: {
                        '200': {
                            description: 'Sub-skills retrieved successfully',
                            content: {
                                'application/json': {
                                    schema: {
                                        $ref: '#/components/schemas/SubSkillsResponse'
                                    },
                                    example: {
                                        success: true,
                                        message: 'Sub-skills retrieved successfully',
                                        data: [
                                            {
                                                id: 1,
                                                name: 'JavaScript',
                                                description: 'Web development language',
                                                skill_id: 1,
                                                skill: {
                                                    id: 1,
                                                    name: 'Programming',
                                                    description: 'Software development skills'
                                                }
                                            },
                                            {
                                                id: 2,
                                                name: 'Python',
                                                description: 'General-purpose programming language',
                                                skill_id: 1,
                                                skill: {
                                                    id: 1,
                                                    name: 'Programming',
                                                    description: 'Software development skills'
                                                }
                                            }
                                        ]
                                    }
                                }
                            }
                        },
                        '401': {
                            description: 'Unauthorized - Invalid or missing access token',
                            content: {
                                'application/json': {
                                    schema: {
                                        $ref: '#/components/schemas/Error'
                                    },
                                    examples: {
                                        missing_token: {
                                            summary: 'Missing access token',
                                            value: {
                                                success: false,
                                                message: 'Access token required'
                                            }
                                        },
                                        invalid_token: {
                                            summary: 'Invalid access token',
                                            value: {
                                                success: false,
                                                message: 'Invalid access token'
                                            }
                                        },
                                        expired_token: {
                                            summary: 'Expired access token',
                                            value: {
                                                success: false,
                                                message: 'Access token expired'
                                            }
                                        },
                                        revoked_token: {
                                            summary: 'Revoked access token',
                                            value: {
                                                success: false,
                                                message: 'Token has been revoked'
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        '500': {
                            description: 'Internal server error',
                            content: {
                                'application/json': {
                                    schema: {
                                        $ref: '#/components/schemas/Error'
                                    }
                                }
                            }
                        }
                    }
                }
            },
            '/users/profile': {
                get: {
                    summary: 'Get current user profile',
                    description: 'Retrieve complete profile data including personal and work information for the authenticated user',
                    tags: ['Users'],
                    security: [
                        {
                            bearerAuth: []
                        }
                    ],
                    responses: {
                        '200': {
                            description: 'Profile retrieved successfully',
                            content: {
                                'application/json': {
                                    schema: {
                                        $ref: '#/components/schemas/ProfileResponse'
                                    },
                                    example: {
                                        success: true,
                                        message: 'Profile retrieved successfully',
                                        data: {
                                            id: 1,
                                            name: 'John Doe',
                                            email: 'john.doe@example.com',
                                            created_at: '2024-01-01T00:00:00.000Z',
                                            updated_at: '2024-01-01T00:00:00.000Z',
                                            profile: {
                                                id: 1,
                                                phone: '+1234567890',
                                                dob: '1990-01-01',
                                                gender: 'Male',
                                                created_at: '2024-01-01T00:00:00.000Z',
                                                updated_at: '2024-01-01T00:00:00.000Z'
                                            },
                                            work_profiles: [
                                                {
                                                    id: 1,
                                                    company_name: 'Tech Corp',
                                                    designation: 'Senior Developer',
                                                    start_date: '2022-01-01',
                                                    end_date: null,
                                                    created_at: '2024-01-01T00:00:00.000Z',
                                                    updated_at: '2024-01-01T00:00:00.000Z',
                                                    userSkills: [
                                                        {
                                                            id: 1,
                                                            proficiency_level: 'Expert',
                                                            created_at: '2024-01-01T00:00:00.000Z',
                                                            updated_at: '2024-01-01T00:00:00.000Z',
                                                            skill: {
                                                                id: 1,
                                                                name: 'Programming',
                                                                description: 'Software development skills'
                                                            },
                                                            subSkill: {
                                                                id: 1,
                                                                name: 'JavaScript',
                                                                description: 'Web development language'
                                                            }
                                                        }
                                                    ]
                                                }
                                            ],
                                            addresses: [
                                                {
                                                    id: 1,
                                                    street: '123 Main St',
                                                    city: 'New York',
                                                    state: 'NY',
                                                    zip_code: '10001',
                                                    country: 'USA',
                                                    type: 'home',
                                                    created_at: '2024-01-01T00:00:00.000Z',
                                                    updated_at: '2024-01-01T00:00:00.000Z'
                                                }
                                            ],
                                             temp_addresses: [
                                                 {
                                                     id: 1,
                                                     location_data: 'GPS: 28.6139,77.2090',
                                                     pincode: '110001',
                                                     selected_area: 'Connaught Place',
                                                     city: 'New Delhi',
                                                     state: 'Delhi',
                                                     country: 'India',
                                                     location_permission: true,
                                                     is_active: true,
                                                     expires_at: '2024-02-01T00:00:00.000Z',
                                                     created_at: '2024-01-01T00:00:00.000Z',
                                                     updated_at: '2024-01-01T00:00:00.000Z'
                                                 }
                                             ],
                                            posts: [
                                                {
                                                    id: 1,
                                                    title: 'Need help with React project',
                                                    description: 'Looking for someone to help with a React.js project...',
                                                    medium: 'online',
                                                    status: 'active',
                                                    deadline: '2024-02-01',
                                                    created_at: '2024-01-01T00:00:00.000Z',
                                                    updated_at: '2024-01-01T00:00:00.000Z',
                                                    requiredSkill: {
                                                        id: 1,
                                                        name: 'Programming',
                                                        description: 'Software development skills'
                                                    },
                                                    requiredSubSkill: {
                                                        id: 2,
                                                        name: 'React.js',
                                                        description: 'React JavaScript library'
                                                    },
                                                    attachments: [
                                                        {
                                                            id: 1,
                                                            file_path: '/uploads/documents/requirements.pdf',
                                                            file_name: 'requirements.pdf',
                                                            mime_type: 'application/pdf',
                                                            uploaded_at: '2024-01-01T00:00:00.000Z'
                                                        }
                                                    ]
                                                }
                                            ]
                                        }
                                    }
                                }
                            }
                        },
                        '401': {
                            description: 'Unauthorized - Invalid or missing access token',
                            content: {
                                'application/json': {
                                    schema: {
                                        $ref: '#/components/schemas/Error'
                                    }
                                }
                            }
                        },
                        '404': {
                            description: 'User not found',
                            content: {
                                'application/json': {
                                    schema: {
                                        $ref: '#/components/schemas/Error'
                                    }
                                }
                            }
                        },
                        '500': {
                            description: 'Internal server error',
                            content: {
                                'application/json': {
                                    schema: {
                                        $ref: '#/components/schemas/Error'
                                    }
                                }
                            }
                        }
                    }
                },
                put: {
                    summary: 'Update user profile',
                    description: 'Update basic profile information (name, email, phone, date of birth). At least one field must be provided. All fields are optional but cannot be empty, null, or undefined if provided.',
                    tags: ['Users'],
                    security: [
                        {
                            bearerAuth: []
                        }
                    ],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: '#/components/schemas/UpdateProfileRequest'
                                },
                                examples: {
                                    single_field_update: {
                                        summary: 'Update single field (name)',
                                        value: {
                                            name: 'John Smith'
                                        }
                                    },
                                    multiple_fields_update: {
                                        summary: 'Update multiple fields',
                                        value: {
                                            name: 'John Smith',
                                            email: 'john.smith@example.com',
                                            phone: '+1234567890',
                                            dob: '1990-05-15'
                                        }
                                    },
                                    email_only: {
                                        summary: 'Update email only',
                                        value: {
                                            email: 'newemail@example.com'
                                        }
                                    },
                                    phone_and_dob: {
                                        summary: 'Update phone and date of birth',
                                        value: {
                                            phone: '+9876543210',
                                            dob: '1985-12-25'
                                        }
                                    }
                                }
                            }
                        }
                    },
                    responses: {
                        '200': {
                            description: 'Profile updated successfully',
                            content: {
                                'application/json': {
                                    schema: {
                                        $ref: '#/components/schemas/UpdateProfileResponse'
                                    },
                                    example: {
                                        success: true,
                                        message: 'Profile updated successfully',
                                        data: {
                                            id: 1,
                                            name: 'John Smith',
                                            email: 'john.smith@example.com',
                                            created_at: '2024-01-01T00:00:00.000Z',
                                            updated_at: '2024-01-15T10:30:00.000Z',
                                            profile: {
                                                id: 1,
                                                phone: '+1234567890',
                                                dob: '1990-05-15',
                                                gender: 'Male',
                                                created_at: '2024-01-01T00:00:00.000Z',
                                                updated_at: '2024-01-15T10:30:00.000Z'
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        '400': {
                            description: 'Validation error',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            success: { type: 'boolean', example: false },
                                            message: { type: 'string', example: 'Validation failed' },
                                            errors: {
                                                type: 'array',
                                                items: {
                                                    type: 'object',
                                                    properties: {
                                                        field: { type: 'string', description: 'Field name that failed validation' },
                                                        message: { type: 'string', description: 'Validation error message' },
                                                        value: { type: 'string', description: 'Invalid value provided' }
                                                    }
                                                }
                                            }
                                        }
                                    },
                                    examples: {
                                        no_fields_provided: {
                                            summary: 'No fields provided',
                                            value: {
                                                success: false,
                                                message: 'At least one field (name, email, phone, or dob) must be provided for update'
                                            }
                                        },
                                        empty_name: {
                                            summary: 'Empty name field',
                                            value: {
                                                success: false,
                                                message: 'Validation failed',
                                                errors: [
                                                    {
                                                        field: 'name',
                                                        message: 'Name cannot be empty, null, or undefined',
                                                        value: ''
                                                    }
                                                ]
                                            }
                                        },
                                        invalid_email: {
                                            summary: 'Invalid email format',
                                            value: {
                                                success: false,
                                                message: 'Validation failed',
                                                errors: [
                                                    {
                                                        field: 'email',
                                                        message: 'Please provide a valid email address',
                                                        value: 'invalid-email'
                                                    }
                                                ]
                                            }
                                        },
                                        invalid_date: {
                                            summary: 'Invalid date format',
                                            value: {
                                                success: false,
                                                message: 'Validation failed',
                                                errors: [
                                                    {
                                                        field: 'dob',
                                                        message: 'Date of birth must be in YYYY-MM-DD format',
                                                        value: '1990/01/01'
                                                    }
                                                ]
                                            }
                                        },
                                        future_date: {
                                            summary: 'Future date of birth',
                                            value: {
                                                success: false,
                                                message: 'Validation failed',
                                                errors: [
                                                    {
                                                        field: 'dob',
                                                        message: 'Date of birth cannot be in the future',
                                                        value: '2025-01-01'
                                                    }
                                                ]
                                            }
                                        },
                                        invalid_phone: {
                                            summary: 'Invalid phone format',
                                            value: {
                                                success: false,
                                                message: 'Validation failed',
                                                errors: [
                                                    {
                                                        field: 'phone',
                                                        message: 'Phone number format is invalid',
                                                        value: 'abc123'
                                                    }
                                                ]
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        '401': {
                            description: 'Unauthorized - Invalid or missing access token',
                            content: {
                                'application/json': {
                                    schema: {
                                        $ref: '#/components/schemas/Error'
                                    }
                                }
                            }
                        },
                        '409': {
                            description: 'Conflict - Email already exists',
                            content: {
                                'application/json': {
                                    schema: {
                                        $ref: '#/components/schemas/Error'
                                    },
                                    example: {
                                        success: false,
                                        message: 'Email already exists. Please use a different email address.'
                                    }
                                }
                            }
                        },
                        '500': {
                            description: 'Internal server error',
                            content: {
                                'application/json': {
                                    schema: {
                                        $ref: '#/components/schemas/Error'
                                    }
                                }
                            }
                        }
                    }
                }
            },
            '/users/profile/{id}': {
                get: {
                    summary: 'Get profile by user ID',
                    description: 'Retrieve profile data for a specific user (restricted to own profile)',
                    tags: ['Users'],
                    security: [
                        {
                            bearerAuth: []
                        }
                    ],
                    parameters: [
                        {
                            name: 'id',
                            in: 'path',
                            required: true,
                            description: 'User ID',
                            schema: {
                                type: 'integer',
                                example: 1
                            }
                        }
                    ],
                    responses: {
                        '200': {
                            description: 'Profile retrieved successfully',
                            content: {
                                'application/json': {
                                    schema: {
                                        $ref: '#/components/schemas/ProfileResponse'
                                    }
                                }
                            }
                        },
                        '401': {
                            description: 'Unauthorized - Invalid or missing access token',
                            content: {
                                'application/json': {
                                    schema: {
                                        $ref: '#/components/schemas/Error'
                                    }
                                }
                            }
                        },
                        '403': {
                            description: 'Forbidden - Can only view own profile',
                            content: {
                                'application/json': {
                                    schema: {
                                        $ref: '#/components/schemas/Error'
                                    },
                                    example: {
                                        success: false,
                                        message: 'Access denied. You can only view your own profile.'
                                    }
                                }
                            }
                        },
                        '404': {
                            description: 'User not found',
                            content: {
                                'application/json': {
                                    schema: {
                                        $ref: '#/components/schemas/Error'
                                    },
                                    example: {
                                        success: false,
                                        message: 'User not found'
                                    }
                                }
                            }
                        },
                        '500': {
                            description: 'Internal server error',
                            content: {
                                'application/json': {
                                    schema: {
                                        $ref: '#/components/schemas/Error'
                                    }
                                }
                            }
                        }
                    }
                }
            },
            '/users/public-profile/{id}': {
                get: {
                    summary: 'Get public profile by user ID',
                    description: 'Retrieve limited public profile information for any user (name, work experience, basic info only)',
                    tags: ['Users'],
                    security: [
                        {
                            bearerAuth: []
                        }
                    ],
                    parameters: [
                        {
                            name: 'id',
                            in: 'path',
                            required: true,
                            description: 'User ID to view public profile',
                            schema: {
                                type: 'integer',
                                example: 1
                            }
                        }
                    ],
                    responses: {
                        '200': {
                            description: 'Public profile retrieved successfully',
                            content: {
                                'application/json': {
                                    schema: {
                                        $ref: '#/components/schemas/PublicProfileResponse'
                                    },
                                    example: {
                                        success: true,
                                        message: 'Public profile retrieved successfully',
                                        data: {
                                            id: 1,
                                            name: 'John Doe',
                                            member_since: '2024-01-01T00:00:00.000Z',
                                            profile: {
                                                gender: 'Male'
                                            },
                                            work_experience: [
                                                {
                                                    company_name: 'Tech Corp',
                                                    designation: 'Senior Developer',
                                                    start_date: '2022-01-01',
                                                    end_date: null,
                                                    duration: '2 years 3 months'
                                                },
                                                {
                                                    company_name: 'Previous Corp',
                                                    designation: 'Junior Developer',
                                                    start_date: '2020-01-01',
                                                    end_date: '2021-12-31',
                                                    duration: '2 years'
                                                }
                                            ]
                                        }
                                    }
                                }
                            }
                        },
                        '401': {
                            description: 'Unauthorized - Invalid or missing access token',
                            content: {
                                'application/json': {
                                    schema: {
                                        $ref: '#/components/schemas/Error'
                                    },
                                    examples: {
                                        missing_token: {
                                            summary: 'Missing access token',
                                            value: {
                                                success: false,
                                                message: 'Access token required'
                                            }
                                        },
                                        invalid_token: {
                                            summary: 'Invalid access token',
                                            value: {
                                                success: false,
                                                message: 'Invalid access token'
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        '404': {
                            description: 'User not found',
                            content: {
                                'application/json': {
                                    schema: {
                                        $ref: '#/components/schemas/Error'
                                    },
                                    example: {
                                        success: false,
                                        message: 'User not found'
                                    }
                                }
                            }
                        },
                        '500': {
                            description: 'Internal server error',
                            content: {
                                'application/json': {
                                    schema: {
                                        $ref: '#/components/schemas/Error'
                                    }
                                }
                            }
                        }
                    }
                }
            },
            '/posts': {
                post: {
                    summary: 'Create a new post',
                    description: 'Create a new post with optional skill requirements, deadline, and file attachments',
                    tags: ['Posts'],
                    security: [{ bearerAuth: [] }],
                    requestBody: {
                        required: true,
                        content: {
                            'multipart/form-data': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        title: { 
                                            type: 'string', 
                                            description: 'Post title (optional, 1-255 characters)'
                                        },
                                        description: { 
                                            type: 'string', 
                                            description: 'Post description (optional, 1-5000 characters)'
                                        },
                                        required_skill_id: { 
                                            type: 'integer', 
                                            description: 'Required skill ID (optional, positive integer)'
                                        },
                                        required_sub_skill_id: { 
                                            type: 'integer', 
                                            description: 'Required sub-skill ID (optional, positive integer)'
                                        },
                                        medium: { 
                                            type: 'string', 
                                            enum: ['online', 'offline'], 
                                            description: 'Collaboration medium (optional, defaults to online)'
                                        },
                                        deadline: { 
                                            type: 'string', 
                                            format: 'date', 
                                            description: 'Project deadline (optional, must be future date)'
                                        },
                                        attachments: {
                                            type: 'array',
                                            items: {
                                                type: 'string',
                                                format: 'binary'
                                            },
                                            description: 'File attachments (optional, max 5 files, 5MB each). Allowed types: JPEG, PNG, GIF, PDF',
                                            maxItems: 5
                                        }
                                    }
                                }
                            },
                            'application/json': {
                                schema: {
                                    $ref: '#/components/schemas/PostCreation'
                                },
                                examples: {
                                    complete_post: {
                                        summary: 'Complete post with all fields',
                                        value: {
                                            title: 'Need help with React project',
                                            description: 'Looking for someone to help with a React.js project involving state management and API integration.',
                                            required_skill_id: 1,
                                            required_sub_skill_id: 2,
                                            medium: 'online',
                                            deadline: '2024-12-31'
                                        }
                                    },
                                    minimal_post: {
                                        summary: 'Minimal post with only description',
                                        value: {
                                            description: 'Need help with a programming task'
                                        }
                                    }
                                }
                            }
                        }
                    },
                    responses: {
                        '201': {
                            description: 'Post created successfully',
                            content: {
                                'application/json': {
                                    schema: {
                                        $ref: '#/components/schemas/PostResponse'
                                    }
                                }
                            }
                        },
                        '400': {
                            description: 'Validation error',
                            content: {
                                'application/json': {
                                    schema: {
                                        $ref: '#/components/schemas/ValidationError'
                                    }
                                }
                            }
                        },
                        '401': {
                            description: 'Unauthorized - Invalid or missing token',
                            content: {
                                'application/json': {
                                    schema: {
                                        $ref: '#/components/schemas/Error'
                                    }
                                }
                            }
                        },
                        '500': {
                            description: 'Internal server error',
                            content: {
                                'application/json': {
                                    schema: {
                                        $ref: '#/components/schemas/Error'
                                    }
                                }
                            }
                        }
                    }
                },
                get: {
                    summary: 'Get all posts',
                    description: 'Retrieve all posts with optional filtering and pagination',
                    tags: ['Posts'],
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        {
                            name: 'page',
                            in: 'query',
                            description: 'Page number for pagination',
                            required: false,
                            schema: {
                                type: 'integer',
                                minimum: 1,
                                default: 1,
                                example: 1
                            }
                        },
                        {
                            name: 'limit',
                            in: 'query',
                            description: 'Number of items per page',
                            required: false,
                            schema: {
                                type: 'integer',
                                minimum: 1,
                                maximum: 100,
                                default: 10,
                                example: 10
                            }
                        },
                        {
                            name: 'status',
                            in: 'query',
                            description: 'Filter by post status',
                            required: false,
                            schema: {
                                type: 'string',
                                enum: ['active', 'hold', 'discussed', 'completed', 'deleted'],
                                example: 'active'
                            }
                        },
                        {
                            name: 'medium',
                            in: 'query',
                            description: 'Filter by collaboration medium',
                            required: false,
                            schema: {
                                type: 'string',
                                enum: ['online', 'offline'],
                                example: 'online'
                            }
                        },
                        {
                            name: 'skill_id',
                            in: 'query',
                            description: 'Filter by required skill ID',
                            required: false,
                            schema: {
                                type: 'integer',
                                minimum: 1,
                                example: 1
                            }
                        }
                    ],
                    responses: {
                        '200': {
                            description: 'Posts retrieved successfully',
                            content: {
                                'application/json': {
                                    schema: {
                                        $ref: '#/components/schemas/PostsResponse'
                                    }
                                }
                            }
                        },
                        '401': {
                            description: 'Unauthorized - Invalid or missing token',
                            content: {
                                'application/json': {
                                    schema: {
                                        $ref: '#/components/schemas/Error'
                                    }
                                }
                            }
                        },
                        '500': {
                            description: 'Internal server error',
                            content: {
                                'application/json': {
                                    schema: {
                                        $ref: '#/components/schemas/Error'
                                    }
                                }
                            }
                        }
                    }
                }
            },
            '/posts/{id}': {
                get: {
                    summary: 'Get post by ID',
                    description: 'Retrieve a specific post by its ID with all associated data',
                    tags: ['Posts'],
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        {
                            name: 'id',
                            in: 'path',
                            description: 'Post ID',
                            required: true,
                            schema: {
                                type: 'integer',
                                minimum: 1,
                                example: 1
                            }
                        }
                    ],
                    responses: {
                        '200': {
                            description: 'Post retrieved successfully',
                            content: {
                                'application/json': {
                                    schema: {
                                        $ref: '#/components/schemas/PostResponse'
                                    }
                                }
                            }
                        },
                        '401': {
                            description: 'Unauthorized - Invalid or missing token',
                            content: {
                                'application/json': {
                                    schema: {
                                        $ref: '#/components/schemas/Error'
                                    }
                                }
                            }
                        },
                        '404': {
                            description: 'Post not found',
                            content: {
                                'application/json': {
                                    schema: {
                                        $ref: '#/components/schemas/Error'
                                    },
                                    example: {
                                        success: false,
                                        message: 'Post not found'
                                    }
                                }
                            }
                        },
                        '500': {
                            description: 'Internal server error',
                            content: {
                                'application/json': {
                                    schema: {
                                        $ref: '#/components/schemas/Error'
                                    }
                                }
                            }
                        }
                    }
                }
            },
            '/posts/{id}': {
                put: {
                    summary: 'Update existing post',
                    description: 'Update an existing post (only post owner can update)',
                    tags: ['Posts'],
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        {
                            name: 'id',
                            in: 'path',
                            description: 'Post ID',
                            required: true,
                            schema: {
                                type: 'integer',
                                minimum: 1,
                                example: 1
                            }
                        }
                    ],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: '#/components/schemas/PostUpdate'
                                },
                                examples: {
                                    update_title_description: {
                                        summary: 'Update title and description',
                                        value: {
                                            title: 'Updated: Need React.js Expert',
                                            description: 'Updated description: Looking for an experienced React.js developer for a complex enterprise project.'
                                        }
                                    },
                                    update_status: {
                                        summary: 'Update post status',
                                        value: {
                                            status: 'hold'
                                        }
                                    },
                                    update_skills: {
                                        summary: 'Update required skills',
                                        value: {
                                            required_skill_id: 2,
                                            required_sub_skill_id: 5
                                        }
                                    },
                                    clear_deadline: {
                                        summary: 'Clear deadline',
                                        value: {
                                            deadline: null
                                        }
                                    },
                                    complete_update: {
                                        summary: 'Update multiple fields',
                                        value: {
                                            title: 'Updated: Full-stack Developer Needed',
                                            description: 'Updated project requirements for full-stack development.',
                                            medium: 'offline',
                                            status: 'active',
                                            deadline: '2025-02-01'
                                        }
                                    }
                                }
                            }
                        }
                    },
                    responses: {
                        '200': {
                            description: 'Post updated successfully',
                            content: {
                                'application/json': {
                                    schema: {
                                        $ref: '#/components/schemas/PostResponse'
                                    }
                                }
                            }
                        },
                        '400': {
                            description: 'Validation error or invalid skill ID',
                            content: {
                                'application/json': {
                                    schema: {
                                        $ref: '#/components/schemas/ValidationError'
                                    },
                                    examples: {
                                        invalid_status: {
                                            summary: 'Invalid status value',
                                            value: {
                                                success: false,
                                                message: 'Validation failed',
                                                errors: [
                                                    {
                                                        field: 'status',
                                                        message: 'Status must be one of: active, hold, discussed, completed, deleted',
                                                        value: 'invalid_status'
                                                    }
                                                ]
                                            }
                                        },
                                        invalid_skill: {
                                            summary: 'Invalid skill ID',
                                            value: {
                                                success: false,
                                                message: 'Invalid skill ID provided'
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        '401': {
                            description: 'Unauthorized - Invalid or missing token',
                            content: {
                                'application/json': {
                                    schema: {
                                        $ref: '#/components/schemas/Error'
                                    }
                                }
                            }
                        },
                        '404': {
                            description: 'Post not found or access denied',
                            content: {
                                'application/json': {
                                    schema: {
                                        $ref: '#/components/schemas/Error'
                                    },
                                    example: {
                                        success: false,
                                        message: "Post not found or you don't have permission to update it"
                                    }
                                }
                            }
                        },
                        '500': {
                            description: 'Internal server error',
                            content: {
                                'application/json': {
                                    schema: {
                                        $ref: '#/components/schemas/Error'
                                    }
                                }
                            }
                        }
                    }
                }
            },
            '/posts/matching': {
                get: {
                    summary: 'Get matching posts for logged-in user',
                    description: 'Retrieve posts that match the logged-in user\'s skills, sub-skills, and location with configurable filtering and scoring',
                    tags: ['Posts'],
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        {
                            name: 'page',
                            in: 'query',
                            description: 'Page number for pagination',
                            required: false,
                            schema: {
                                type: 'integer',
                                minimum: 1,
                                default: 1,
                                example: 1
                            }
                        },
                        {
                            name: 'limit',
                            in: 'query',
                            description: 'Number of items per page',
                            required: false,
                            schema: {
                                type: 'integer',
                                minimum: 1,
                                maximum: 100,
                                default: 10,
                                example: 10
                            }
                        },
                        {
                            name: 'status',
                            in: 'query',
                            description: 'Filter by post status (default: active)',
                            required: false,
                            schema: {
                                type: 'string',
                                enum: ['active', 'hold', 'discussed', 'completed', 'deleted'],
                                default: 'active',
                                example: 'active'
                            }
                        },
                        {
                            name: 'medium',
                            in: 'query',
                            description: 'Filter by collaboration medium',
                            required: false,
                            schema: {
                                type: 'string',
                                enum: ['online', 'offline'],
                                example: 'online'
                            }
                        },
                        {
                            name: 'min_match_score',
                            in: 'query',
                            description: 'Minimum match percentage (0-100)',
                            required: false,
                            schema: {
                                type: 'integer',
                                minimum: 0,
                                maximum: 100,
                                example: 50
                            }
                        },
                        {
                            name: 'match_skills',
                            in: 'query',
                            description: 'Enable skill-based matching (default: true)',
                            required: false,
                            schema: {
                                type: 'boolean',
                                default: true,
                                example: true
                            }
                        },
                        {
                            name: 'match_sub_skills',
                            in: 'query',
                            description: 'Enable sub-skill-based matching (default: true)',
                            required: false,
                            schema: {
                                type: 'boolean',
                                default: true,
                                example: true
                            }
                        },
                        {
                            name: 'match_location',
                            in: 'query',
                            description: 'Enable location/pincode-based matching (default: true)',
                            required: false,
                            schema: {
                                type: 'boolean',
                                default: true,
                                example: true
                            }
                        }
                    ],
                    responses: {
                        '200': {
                            description: 'Matching posts retrieved successfully',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            success: { type: 'boolean', example: true },
                                            message: { type: 'string', example: 'Matching posts retrieved successfully' },
                                            data: {
                                                type: 'array',
                                                items: {
                                                    allOf: [
                                                        { $ref: '#/components/schemas/Post' },
                                                        {
                                                            type: 'object',
                                                            properties: {
                                                                matchScore: {
                                                                    type: 'object',
                                                                    properties: {
                                                                        score: { type: 'integer', example: 5, description: 'Raw match score' },
                                                                        maxScore: { type: 'integer', example: 6, description: 'Maximum possible score' },
                                                                        percentage: { type: 'integer', example: 83, description: 'Match percentage (0-100)' },
                                                                        reasons: {
                                                                            type: 'object',
                                                                            properties: {
                                                                                skillMatch: { type: 'boolean', example: true },
                                                                                subSkillMatch: { type: 'boolean', example: true },
                                                                                locationMatch: { type: 'boolean', example: true }
                                                                            }
                                                                        }
                                                                    }
                                                                }
                                                            }
                                                        }
                                                    ]
                                                }
                                            },
                                            pagination: {
                                                type: 'object',
                                                properties: {
                                                    currentPage: { type: 'integer', example: 1 },
                                                    totalPages: { type: 'integer', example: 3 },
                                                    totalItems: { type: 'integer', example: 25 },
                                                    itemsPerPage: { type: 'integer', example: 10 }
                                                }
                                            },
                                            matchingCriteria: {
                                                type: 'object',
                                                properties: {
                                                    enabled: {
                                                        type: 'object',
                                                        properties: {
                                                            skills: { type: 'boolean', example: true, description: 'Whether skill matching is enabled' },
                                                            subSkills: { type: 'boolean', example: true, description: 'Whether sub-skill matching is enabled' },
                                                            location: { type: 'boolean', example: true, description: 'Whether location matching is enabled' }
                                                        }
                                                    },
                                                    userDataCounts: {
                                                        type: 'object',
                                                        properties: {
                                                            skills: { type: 'integer', example: 5, nullable: true, description: 'Number of user skills (null if disabled)' },
                                                            subSkills: { type: 'integer', example: 8, nullable: true, description: 'Number of user sub-skills (null if disabled)' },
                                                            locations: { type: 'integer', example: 2, nullable: true, description: 'Number of user locations (null if disabled)' }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        '401': {
                            description: 'Unauthorized - Invalid or missing token',
                            content: {
                                'application/json': {
                                    schema: {
                                        $ref: '#/components/schemas/Error'
                                    }
                                }
                            }
                        },
                        '500': {
                            description: 'Internal server error',
                            content: {
                                'application/json': {
                                    schema: {
                                        $ref: '#/components/schemas/Error'
                                    }
                                }
                            }
                        }
                    }
                }
            },
            '/posts/{id}/attachments': {
                post: {
                    summary: 'Add attachments to existing post',
                    description: 'Upload file attachments to an existing post',
                    tags: ['Posts'],
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        {
                            name: 'id',
                            in: 'path',
                            description: 'Post ID',
                            required: true,
                            schema: {
                                type: 'integer',
                                minimum: 1,
                                example: 1
                            }
                        }
                    ],
                    requestBody: {
                        required: true,
                        content: {
                            'multipart/form-data': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        attachments: {
                                            type: 'array',
                                            items: {
                                                type: 'string',
                                                format: 'binary'
                                            },
                                            description: 'File attachments (max 5 files, 5MB each). Allowed types: JPEG, PNG, GIF, PDF',
                                            maxItems: 5
                                        }
                                    },
                                    required: ['attachments']
                                }
                            }
                        }
                    },
                    responses: {
                        '201': {
                            description: 'Attachments uploaded successfully',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            success: { type: 'boolean', example: true },
                                            message: { type: 'string', example: 'Attachments uploaded successfully' },
                                            data: {
                                                type: 'array',
                                                items: {
                                                    $ref: '#/components/schemas/PostAttachment'
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        '400': {
                            description: 'Bad request - No files uploaded or invalid file type',
                            content: {
                                'application/json': {
                                    schema: {
                                        $ref: '#/components/schemas/Error'
                                    }
                                }
                            }
                        },
                        '401': {
                            description: 'Unauthorized',
                            content: {
                                'application/json': {
                                    schema: {
                                        $ref: '#/components/schemas/Error'
                                    }
                                }
                            }
                        },
                        '404': {
                            description: 'Post not found or access denied',
                            content: {
                                'application/json': {
                                    schema: {
                                        $ref: '#/components/schemas/Error'
                                    }
                                }
                            }
                        },
                        '500': {
                            description: 'Internal server error',
                            content: {
                                'application/json': {
                                    schema: {
                                        $ref: '#/components/schemas/Error'
                                    }
                                }
                            }
                        }
                    }
                }
            },
            '/posts/attachments/{attachmentId}/download': {
                get: {
                    summary: 'Download attachment',
                    description: 'Download a specific attachment by its ID',
                    tags: ['Posts'],
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        {
                            name: 'attachmentId',
                            in: 'path',
                            description: 'Attachment ID',
                            required: true,
                            schema: {
                                type: 'integer',
                                minimum: 1,
                                example: 1
                            }
                        }
                    ],
                    responses: {
                        '200': {
                            description: 'File downloaded successfully',
                            content: {
                                'application/octet-stream': {
                                    schema: {
                                        type: 'string',
                                        format: 'binary'
                                    }
                                }
                            }
                        },
                        '401': {
                            description: 'Unauthorized',
                            content: {
                                'application/json': {
                                    schema: {
                                        $ref: '#/components/schemas/Error'
                                    }
                                }
                            }
                        },
                        '404': {
                            description: 'Attachment not found or file missing',
                            content: {
                                'application/json': {
                                    schema: {
                                        $ref: '#/components/schemas/Error'
                                    }
                                }
                            }
                        },
                        '500': {
                            description: 'Internal server error',
                            content: {
                                'application/json': {
                                    schema: {
                                        $ref: '#/components/schemas/Error'
                                    }
                                }
                            }
                        }
                    }
                }
            },
            '/posts/attachments/{attachmentId}': {
                delete: {
                    summary: 'Delete attachment',
                    description: 'Delete a specific attachment by its ID (only post owner can delete)',
                    tags: ['Posts'],
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        {
                            name: 'attachmentId',
                            in: 'path',
                            description: 'Attachment ID',
                            required: true,
                            schema: {
                                type: 'integer',
                                minimum: 1,
                                example: 1
                            }
                        }
                    ],
                    responses: {
                        '200': {
                            description: 'Attachment deleted successfully',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            success: { type: 'boolean', example: true },
                                            message: { type: 'string', example: 'Attachment deleted successfully' }
                                        }
                                    }
                                }
                            }
                        },
                        '401': {
                            description: 'Unauthorized',
                            content: {
                                'application/json': {
                                    schema: {
                                        $ref: '#/components/schemas/Error'
                                    }
                                }
                            }
                        },
                        '403': {
                            description: 'Forbidden - Not the post owner',
                            content: {
                                'application/json': {
                                    schema: {
                                        $ref: '#/components/schemas/Error'
                                    }
                                }
                            }
                        },
                        '404': {
                            description: 'Attachment not found',
                            content: {
                                'application/json': {
                                    schema: {
                                        $ref: '#/components/schemas/Error'
                                    }
                                }
                            }
                        },
                        '500': {
                            description: 'Internal server error',
                            content: {
                                'application/json': {
                                    schema: {
                                        $ref: '#/components/schemas/Error'
                                    }
                                }
                            }
                        }
                    }
                }
            },
            // Aadhaar Verification APIs
            '/aadhaar/verify-xml': {
                post: {
                    summary: 'Verify Aadhaar XML file (offline eKYC)',
                    description: 'Verifies offline eKYC XML files with share code decryption',
                    tags: ['Aadhaar Verification'],
                    security: [{ bearerAuth: [] }],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: '#/components/schemas/AadhaarXMLVerificationRequest'
                                }
                            }
                        }
                    },
                    responses: {
                        '200': {
                            description: 'Verification completed successfully',
                            content: {
                                'application/json': {
                                    schema: {
                                        $ref: '#/components/schemas/AadhaarVerificationResult'
                                    }
                                }
                            }
                        },
                        '400': {
                            description: 'Invalid request data',
                            content: {
                                'application/json': {
                                    schema: {
                                        $ref: '#/components/schemas/AadhaarErrorResponse'
                                    }
                                }
                            }
                        },
                        '401': {
                            description: 'Unauthorized',
                            content: {
                                'application/json': {
                                    schema: {
                                        $ref: '#/components/schemas/Error'
                                    }
                                }
                            }
                        },
                        '500': {
                            description: 'Internal server error',
                            content: {
                                'application/json': {
                                    schema: {
                                        $ref: '#/components/schemas/Error'
                                    }
                                }
                            }
                        }
                    }
                }
            },
            '/aadhaar/verify-qr': {
                post: {
                    summary: 'Verify Aadhaar QR code',
                    description: 'Verifies Aadhaar QR codes from image files',
                    tags: ['Aadhaar Verification'],
                    security: [{ bearerAuth: [] }],
                    requestBody: {
                        required: true,
                        content: {
                            'multipart/form-data': {
                                schema: {
                                    type: 'object',
                                    required: ['qrImage'],
                                    properties: {
                                        qrImage: {
                                            type: 'string',
                                            format: 'binary',
                                            description: 'QR code image file (JPEG, PNG, BMP, GIF, WebP - Max 5MB)'
                                        }
                                    }
                                }
                            }
                        }
                    },
                    responses: {
                        '200': {
                            description: 'QR verification completed successfully',
                            content: {
                                'application/json': {
                                    schema: {
                                        $ref: '#/components/schemas/AadhaarVerificationResult'
                                    }
                                }
                            }
                        },
                        '400': {
                            description: 'Invalid request data or file',
                            content: {
                                'application/json': {
                                    schema: {
                                        $ref: '#/components/schemas/AadhaarErrorResponse'
                                    }
                                }
                            }
                        },
                        '401': {
                            description: 'Unauthorized',
                            content: {
                                'application/json': {
                                    schema: {
                                        $ref: '#/components/schemas/Error'
                                    }
                                }
                            }
                        },
                        '500': {
                            description: 'Internal server error',
                            content: {
                                'application/json': {
                                    schema: {
                                        $ref: '#/components/schemas/Error'
                                    }
                                }
                            }
                        }
                    }
                }
            },
            '/aadhaar/validate-number': {
                post: {
                    summary: 'Validate Aadhaar number format',
                    description: 'Validates Aadhaar number format and Verhoeff checksum',
                    tags: ['Aadhaar Verification'],
                    security: [{ bearerAuth: [] }],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: '#/components/schemas/AadhaarNumberValidationRequest'
                                }
                            }
                        }
                    },
                    responses: {
                        '200': {
                            description: 'Number validation completed',
                            content: {
                                'application/json': {
                                    schema: {
                                        $ref: '#/components/schemas/AadhaarVerificationResult'
                                    }
                                }
                            }
                        },
                        '400': {
                            description: 'Invalid request data',
                            content: {
                                'application/json': {
                                    schema: {
                                        $ref: '#/components/schemas/AadhaarErrorResponse'
                                    }
                                }
                            }
                        },
                        '401': {
                            description: 'Unauthorized',
                            content: {
                                'application/json': {
                                    schema: {
                                        $ref: '#/components/schemas/Error'
                                    }
                                }
                            }
                        },
                        '500': {
                            description: 'Internal server error',
                            content: {
                                'application/json': {
                                    schema: {
                                        $ref: '#/components/schemas/Error'
                                    }
                                }
                            }
                        }
                    }
                }
            },
            '/aadhaar/verification-history': {
                get: {
                    summary: 'Get verification history',
                    description: 'Retrieves verification history for the authenticated user',
                    tags: ['Aadhaar Verification'],
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        {
                            name: 'limit',
                            in: 'query',
                            schema: {
                                type: 'integer',
                                minimum: 1,
                                maximum: 100,
                                default: 10
                            },
                            description: 'Number of records to return'
                        },
                        {
                            name: 'offset',
                            in: 'query',
                            schema: {
                                type: 'integer',
                                minimum: 0,
                                default: 0
                            },
                            description: 'Number of records to skip'
                        }
                    ],
                    responses: {
                        '200': {
                            description: 'Verification history retrieved successfully',
                            content: {
                                'application/json': {
                                    schema: {
                                        $ref: '#/components/schemas/AadhaarVerificationHistory'
                                    }
                                }
                            }
                        },
                        '401': {
                            description: 'Unauthorized',
                            content: {
                                'application/json': {
                                    schema: {
                                        $ref: '#/components/schemas/Error'
                                    }
                                }
                            }
                        },
                        '500': {
                            description: 'Internal server error',
                            content: {
                                'application/json': {
                                    schema: {
                                        $ref: '#/components/schemas/Error'
                                    }
                                }
                            }
                        }
                    }
                }
            },
            '/aadhaar/verification/{verificationId}': {
                get: {
                    summary: 'Get verification details',
                    description: 'Retrieves detailed information about a specific verification',
                    tags: ['Aadhaar Verification'],
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        {
                            name: 'verificationId',
                            in: 'path',
                            required: true,
                            schema: {
                                type: 'string',
                                format: 'uuid'
                            },
                            description: 'Verification ID'
                        }
                    ],
                    responses: {
                        '200': {
                            description: 'Verification details retrieved successfully',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            success: { type: 'boolean', example: true },
                                            requestId: { type: 'string', format: 'uuid' },
                                            data: {
                                                type: 'object',
                                                properties: {
                                                    id: { type: 'string', format: 'uuid' },
                                                    verificationId: { type: 'string', format: 'uuid' },
                                                    verificationType: { type: 'string', enum: ['XML', 'QR', 'NUMBER'] },
                                                    verificationStatus: { type: 'string', enum: ['SUCCESS', 'FAILED', 'PENDING'] },
                                                    maskedAadhaarNumber: { type: 'string', example: 'XXXX XXXX 1234' },
                                                    verificationData: { type: 'object' },
                                                    signatureValid: { type: 'boolean', nullable: true },
                                                    timestampValid: { type: 'boolean', nullable: true },
                                                    checksumValid: { type: 'boolean', nullable: true },
                                                    verificationTime: { type: 'string', format: 'date-time' },
                                                    logs: {
                                                        type: 'array',
                                                        items: {
                                                            type: 'object',
                                                            properties: {
                                                                action: { type: 'string' },
                                                                status: { type: 'string', enum: ['SUCCESS', 'FAILED', 'WARNING'] },
                                                                message: { type: 'string' },
                                                                timestamp: { type: 'string', format: 'date-time' }
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        '401': {
                            description: 'Unauthorized',
                            content: {
                                'application/json': {
                                    schema: {
                                        $ref: '#/components/schemas/Error'
                                    }
                                }
                            }
                        },
                        '404': {
                            description: 'Verification not found',
                            content: {
                                'application/json': {
                                    schema: {
                                        $ref: '#/components/schemas/Error'
                                    }
                                }
                            }
                        },
                        '500': {
                            description: 'Internal server error',
                            content: {
                                'application/json': {
                                    schema: {
                                        $ref: '#/components/schemas/Error'
                                    }
                                }
                            }
                        }
                    }
                }
            },
            '/api/chat/conversations': {
                post: {
                    summary: 'Create a new conversation',
                    tags: ['Chat'],
                    security: [{ bearerAuth: [] }],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    required: ['type', 'memberIds'],
                                    properties: {
                                        type: {
                                            type: 'string',
                                            enum: ['private', 'group']
                                        },
                                        name: {
                                            type: 'string',
                                            description: 'Required for group conversations'
                                        },
                                        description: {
                                            type: 'string'
                                        },
                                        memberIds: {
                                            type: 'array',
                                            items: {
                                                type: 'integer'
                                            },
                                            description: 'Array of user IDs to add to conversation'
                                        }
                                    }
                                }
                            }
                        }
                    },
                    responses: {
                        '201': {
                            description: 'Conversation created successfully',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            success: { type: 'boolean' },
                                            message: { type: 'string' },
                                            data: {
                                                $ref: '#/components/schemas/Conversation'
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        '400': {
                            description: 'Bad request'
                        },
                        '429': {
                            description: 'Rate limit exceeded'
                        }
                    }
                },
                get: {
                    summary: 'Get user\'s conversations',
                    tags: ['Chat'],
                    security: [{ bearerAuth: [] }],
                    responses: {
                        '200': {
                            description: 'Conversations retrieved successfully',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            success: { type: 'boolean' },
                                            message: { type: 'string' },
                                            data: {
                                                type: 'array',
                                                items: {
                                                    $ref: '#/components/schemas/Conversation'
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            '/api/chat/conversations/{id}': {
                get: {
                    summary: 'Get conversation by ID',
                    tags: ['Chat'],
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        {
                            in: 'path',
                            name: 'id',
                            required: true,
                            schema: {
                                type: 'integer'
                            },
                            description: 'Conversation ID'
                        }
                    ],
                    responses: {
                        '200': {
                            description: 'Conversation retrieved successfully'
                        },
                        '403': {
                            description: 'Access denied'
                        },
                        '404': {
                            description: 'Conversation not found'
                        }
                    }
                }
            },
            '/api/chat/conversations/{id}/messages': {
                get: {
                    summary: 'Get conversation messages',
                    tags: ['Chat'],
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        {
                            in: 'path',
                            name: 'id',
                            required: true,
                            schema: {
                                type: 'integer'
                            },
                            description: 'Conversation ID'
                        },
                        {
                            in: 'query',
                            name: 'page',
                            schema: {
                                type: 'integer',
                                minimum: 1,
                                default: 1
                            },
                            description: 'Page number'
                        },
                        {
                            in: 'query',
                            name: 'limit',
                            schema: {
                                type: 'integer',
                                minimum: 1,
                                maximum: 100,
                                default: 50
                            },
                            description: 'Number of messages per page'
                        }
                    ],
                    responses: {
                        '200': {
                            description: 'Messages retrieved successfully',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            success: { type: 'boolean' },
                                            message: { type: 'string' },
                                            data: {
                                                type: 'object',
                                                properties: {
                                                    messages: {
                                                        type: 'array',
                                                        items: {
                                                            $ref: '#/components/schemas/Message'
                                                        }
                                                    },
                                                    pagination: {
                                                        type: 'object',
                                                        properties: {
                                                            currentPage: { type: 'integer' },
                                                            totalPages: { type: 'integer' },
                                                            totalMessages: { type: 'integer' },
                                                            hasNextPage: { type: 'boolean' },
                                                            hasPreviousPage: { type: 'boolean' }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                post: {
                    summary: 'Send a message to a conversation',
                    tags: ['Chat'],
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        {
                            in: 'path',
                            name: 'id',
                            required: true,
                            schema: {
                                type: 'integer'
                            },
                            description: 'Conversation ID'
                        }
                    ],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        content: {
                                            type: 'string',
                                            description: 'Message content (required if no attachment)'
                                        },
                                        messageType: {
                                            type: 'string',
                                            enum: ['text', 'image', 'video', 'audio', 'file'],
                                            default: 'text'
                                        },
                                        replyToMessageId: {
                                            type: 'integer',
                                            description: 'ID of message being replied to'
                                        },
                                        attachmentUrl: {
                                            type: 'string',
                                            description: 'URL of attached file'
                                        },
                                        attachmentName: {
                                            type: 'string',
                                            description: 'Name of attached file'
                                        },
                                        attachmentSize: {
                                            type: 'integer',
                                            description: 'Size of attached file in bytes'
                                        },
                                        attachmentMimeType: {
                                            type: 'string',
                                            description: 'MIME type of attached file'
                                        }
                                    }
                                }
                            }
                        }
                    },
                    responses: {
                        '201': {
                            description: 'Message sent successfully'
                        },
                        '400': {
                            description: 'Bad request'
                        },
                        '429': {
                            description: 'Rate limit exceeded'
                        }
                    }
                }
            },
            '/api/chat/conversations/{id}/stats': {
                get: {
                    summary: 'Get conversation statistics',
                    tags: ['Chat'],
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        {
                            in: 'path',
                            name: 'id',
                            required: true,
                            schema: {
                                type: 'integer'
                            },
                            description: 'Conversation ID'
                        }
                    ],
                    responses: {
                        '200': {
                            description: 'Statistics retrieved successfully',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            success: { type: 'boolean' },
                                            message: { type: 'string' },
                                            data: {
                                                type: 'object',
                                                properties: {
                                                    messageCount: { type: 'integer' },
                                                    memberCount: { type: 'integer' },
                                                    unreadCount: { type: 'integer' }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            '/api/chat/conversations/{id}/typing': {
                get: {
                    summary: 'Get typing status for a conversation',
                    tags: ['Chat'],
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        {
                            in: 'path',
                            name: 'id',
                            required: true,
                            schema: {
                                type: 'integer'
                            },
                            description: 'Conversation ID'
                        }
                    ],
                    responses: {
                        '200': {
                            description: 'Typing status retrieved successfully',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            success: { type: 'boolean' },
                                            message: { type: 'string' },
                                            data: {
                                                type: 'array',
                                                items: {
                                                    type: 'object',
                                                    properties: {
                                                        userId: { type: 'integer' },
                                                        userName: { type: 'string' },
                                                        startedTypingAt: {
                                                            type: 'string',
                                                            format: 'date-time'
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            '/api/chat/messages/{id}/read': {
                put: {
                    summary: 'Mark a message as read',
                    tags: ['Chat'],
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        {
                            in: 'path',
                            name: 'id',
                            required: true,
                            schema: {
                                type: 'integer'
                            },
                            description: 'Message ID'
                        }
                    ],
                    responses: {
                        '200': {
                            description: 'Message marked as read'
                        },
                        '400': {
                            description: 'Failed to mark message as read'
                        }
                    }
                }
            },
            '/api/chat/search': {
                get: {
                    summary: 'Search messages',
                    tags: ['Chat'],
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        {
                            in: 'query',
                            name: 'q',
                            required: true,
                            schema: {
                                type: 'string',
                                minLength: 2,
                                maxLength: 100
                            },
                            description: 'Search query'
                        },
                        {
                            in: 'query',
                            name: 'conversation_id',
                            schema: {
                                type: 'integer'
                            },
                            description: 'Limit search to specific conversation'
                        }
                    ],
                    responses: {
                        '200': {
                            description: 'Search completed successfully',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            success: { type: 'boolean' },
                                            message: { type: 'string' },
                                            data: {
                                                type: 'array',
                                                items: {
                                                    $ref: '#/components/schemas/Message'
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        '400': {
                            description: 'Invalid search query'
                        },
                        '429': {
                            description: 'Rate limit exceeded'
                        }
                    }
                }
            },
            '/api/chat/users/{id}/status': {
                get: {
                    summary: 'Get user\'s online status',
                    tags: ['Chat'],
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        {
                            in: 'path',
                            name: 'id',
                            required: true,
                            schema: {
                                type: 'integer'
                            },
                            description: 'User ID'
                        }
                    ],
                    responses: {
                        '200': {
                            description: 'User status retrieved successfully',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            success: { type: 'boolean' },
                                            message: { type: 'string' },
                                            data: {
                                                type: 'object',
                                                properties: {
                                                    id: { type: 'integer' },
                                                    name: { type: 'string' },
                                                    is_online: { type: 'boolean' },
                                                    last_seen: {
                                                        type: 'string',
                                                        format: 'date-time'
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        '404': {
                            description: 'User not found'
                        }
                    }
                }
            },
            '/api/chat/notifications': {
                get: {
                    summary: 'Get user\'s notifications',
                    tags: ['Chat'],
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        {
                            in: 'query',
                            name: 'page',
                            schema: {
                                type: 'integer',
                                minimum: 1,
                                default: 1
                            },
                            description: 'Page number'
                        },
                        {
                            in: 'query',
                            name: 'limit',
                            schema: {
                                type: 'integer',
                                minimum: 1,
                                maximum: 50,
                                default: 20
                            },
                            description: 'Number of notifications per page'
                        }
                    ],
                    responses: {
                        '200': {
                            description: 'Notifications retrieved successfully',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            success: { type: 'boolean' },
                                            message: { type: 'string' },
                                            data: {
                                                type: 'object',
                                                properties: {
                                                    notifications: {
                                                        type: 'array',
                                                        items: {
                                                            type: 'object',
                                                            properties: {
                                                                id: { type: 'integer' },
                                                                type: { type: 'string' },
                                                                title: { type: 'string' },
                                                                body: { type: 'string' },
                                                                is_seen: { type: 'boolean' },
                                                                is_read: { type: 'boolean' },
                                                                created_at: {
                                                                    type: 'string',
                                                                    format: 'date-time'
                                                                }
                                                            }
                                                        }
                                                    },
                                                    pagination: {
                                                        type: 'object'
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            '/api/chat/notifications/{id}/read': {
                put: {
                    summary: 'Mark a notification as read',
                    tags: ['Chat'],
                    security: [{ bearerAuth: [] }],
                    parameters: [
                        {
                            in: 'path',
                            name: 'id',
                            required: true,
                            schema: {
                                type: 'integer'
                            },
                            description: 'Notification ID'
                        }
                    ],
                    responses: {
                        '200': {
                            description: 'Notification marked as read'
                        },
                        '404': {
                            description: 'Notification not found'
                        }
                    }
                }
            }
        }
    },
    apis: ['./routes/*.js']
};

const specs = swaggerJsdoc(options);

module.exports = specs;