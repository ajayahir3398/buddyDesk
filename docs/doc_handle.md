# File Upload and Storage in Node.js API with PostgreSQL

Here's a comprehensive guide on handling file uploads, storage, and serving files in your Node.js API application:

## File Upload Handling

### Setting Up Multer Middleware

First, install the necessary package for handling file uploads:

```bash
npm install multer
```

Create a multer configuration for handling file uploads:

```javascript
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create uploads directory if it doesn't exist
const uploadDir = './uploads';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Files will be stored in uploads folder
    },
    filename: (req, file, cb) => {
        // Create unique filename with timestamp
        const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
        cb(null, uniqueName);
    }
});

// File filter for allowed types
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'audio/mpeg', 'audio/mp3'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG, PNG images and MP3 audio files are allowed.'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

module.exports = upload;
```

## Database Schema

Create a posts table in PostgreSQL to store post information and file paths:

```sql
CREATE TABLE posts (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    image_path VARCHAR(500),
    audio_path VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Add Post API Endpoint

Create an endpoint to handle post creation with file uploads:

```javascript
const express = require('express');
const upload = require('./middleware/upload'); // Your multer config
const pool = require('./db'); // Your PostgreSQL connection
const router = express.Router();

// Add post with file uploads
router.post('/posts', upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'audio', maxCount: 1 }
]), async (req, res) => {
    try {
        const { title, content } = req.body;
        
        // Get uploaded file paths
        let imagePath = null;
        let audioPath = null;
        
        if (req.files['image']) {
            imagePath = req.files['image'][0].path;
        }
        
        if (req.files['audio']) {
            audioPath = req.files['audio'][0].path;
        }
        
        // Insert into database
        const query = `
            INSERT INTO posts (title, content, image_path, audio_path)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `;
        
        const result = await pool.query(query, [title, content, imagePath, audioPath]);
        
        res.status(201).json({
            success: true,
            message: 'Post created successfully',
            data: result.rows[0]
        });
        
    } catch (error) {
        console.error('Error creating post:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create post',
            error: error.message
        });
    }
});
```

## File Storage Structure

Organize your files in a structured directory:

```
your-project/
├── uploads/
│   ├── images/
│   └── audio/
├── app.js
├── routes/
└── middleware/
```

Enhanced storage configuration for organized file structure:

```javascript
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        let uploadPath = 'uploads/';
        
        if (file.mimetype.startsWith('image/')) {
            uploadPath += 'images/';
        } else if (file.mimetype.startsWith('audio/')) {
            uploadPath += 'audio/';
        }
        
        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
        cb(null, uniqueName);
    }
});
```

## Get Posts API Endpoint

Create an endpoint to retrieve posts with file URLs:

```javascript
// Get all posts
router.get('/posts', async (req, res) => {
    try {
        const query = 'SELECT * FROM posts ORDER BY created_at DESC';
        const result = await pool.query(query);
        
        // Transform file paths to accessible URLs
        const posts = result.rows.map(post => {
            return {
                ...post,
                image_url: post.image_path ? `${req.protocol}://${req.get('host')}/uploads/${path.basename(post.image_path)}` : null,
                audio_url: post.audio_path ? `${req.protocol}://${req.get('host')}/uploads/${path.basename(post.audio_path)}` : null
            };
        });
        
        res.json({
            success: true,
            data: posts
        });
        
    } catch (error) {
        console.error('Error fetching posts:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch posts',
            error: error.message
        });
    }
});

// Get single post by ID
router.get('/posts/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const query = 'SELECT * FROM posts WHERE id = $1';
        const result = await pool.query(query, [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Post not found'
            });
        }
        
        const post = result.rows[0];
        const transformedPost = {
            ...post,
            image_url: post.image_path ? `${req.protocol}://${req.get('host')}/uploads/${path.basename(post.image_path)}` : null,
            audio_url: post.audio_path ? `${req.protocol}://${req.get('host')}/uploads/${path.basename(post.audio_path)}` : null
        };
        
        res.json({
            success: true,
            data: transformedPost
        });
        
    } catch (error) {
        console.error('Error fetching post:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch post',
            error: error.message
        });
    }
});
```

## Serving Static Files

Configure Express to serve uploaded files as static content:

```javascript
const express = require('express');
const path = require('path');
const app = express();

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Your other middleware and routes
app.use('/api', require('./routes/posts'));
```

## Complete Server Setup

Here's how your main server file might look:

```javascript
const express = require('express');
const cors = require('cors');
const path = require('path');
const postRoutes = require('./routes/posts');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (uploaded files)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api', postRoutes);

// Error handling middleware
app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'File size too large'
            });
        }
    }
    
    res.status(500).json({
        success: false,
        message: error.message
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
```

## Frontend Usage Example

Here's how you would send files from the frontend:

```javascript
// JavaScript/React example
const uploadPost = async (formData) => {
    const data = new FormData();
    data.append('title', formData.title);
    data.append('content', formData.content);
    
    if (formData.image) {
        data.append('image', formData.image);
    }
    
    if (formData.audio) {
        data.append('audio', formData.audio);
    }
    
    try {
        const response = await fetch('/api/posts', {
            method: 'POST',
            body: data
        });
        
        const result = await response.json();
        console.log('Post created:', result);
    } catch (error) {
        console.error('Error:', error);
    }
};
```

## Security Considerations

**File Validation**: Always validate file types and sizes to prevent malicious uploads.

**Path Security**: Store only filenames in the database, not full paths, to prevent path traversal attacks.

**Access Control**: Implement authentication and authorization for file uploads and access.

**Virus Scanning**: Consider integrating virus scanning for uploaded files in production.

## Performance Optimizations

**CDN Integration**: For production, consider using cloud storage services like AWS S3 or Cloudinary.

**File Compression**: Implement image compression for uploaded images.

**Caching**: Set appropriate cache headers for static files.

This setup provides a robust foundation for handling file uploads in your Node.js API with proper storage, retrieval, and serving capabilities.