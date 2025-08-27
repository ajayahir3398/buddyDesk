I'll explain how to handle file uploads, storage, and retrieval in your Node.js API with PostgreSQL. Here's a comprehensive guide:

## 1. File Upload Handling

### Install Required Dependencies

```bash
npm install multer path fs-extra
```

### Configure Multer for File Uploads

```javascript
// config/multer.js
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
fs.ensureDirSync(uploadsDir);

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Create subdirectories for different file types
    let uploadPath = uploadsDir;
    
    if (file.mimetype.startsWith('image/')) {
      uploadPath = path.join(uploadsDir, 'images');
    } else if (file.mimetype.startsWith('audio/')) {
      uploadPath = path.join(uploadsDir, 'audio');
    }
    
    fs.ensureDirSync(uploadPath);
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + extension);
  }
});

// File filter for validation
const fileFilter = (req, file, cb) => {
  // Allow images and audio files
  if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('audio/')) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images and audio files are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

module.exports = upload;
```

## 2. Database Schema

### Create Posts Table

```sql
-- Create posts table
CREATE TABLE posts (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    image_path VARCHAR(500),
    image_filename VARCHAR(255),
    audio_path VARCHAR(500),
    audio_filename VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 3. API Endpoints Implementation

### Add Post Endpoint with File Upload

```javascript
// routes/posts.js
const express = require('express');
const router = express.Router();
const upload = require('../config/multer');
const pool = require('../config/database'); // Your PostgreSQL connection
const path = require('path');

// POST /api/posts - Create new post with files
router.post('/posts', upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'audio', maxCount: 1 }
]), async (req, res) => {
  try {
    const { title, content } = req.body;
    
    let imagePath = null;
    let imageFilename = null;
    let audioPath = null;
    let audioFilename = null;

    // Handle uploaded files
    if (req.files) {
      if (req.files.image) {
        const imageFile = req.files.image[0];
        imagePath = imageFile.path;
        imageFilename = imageFile.filename;
      }
      
      if (req.files.audio) {
        const audioFile = req.files.audio[0];
        audioPath = audioFile.path;
        audioFilename = audioFile.filename;
      }
    }

    // Save post data to database
    const query = `
      INSERT INTO posts (title, content, image_path, image_filename, audio_path, audio_filename)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    
    const values = [title, content, imagePath, imageFilename, audioPath, audioFilename];
    const result = await pool.query(query, values);
    
    const post = result.rows[0];
    
    // Construct file URLs for response
    if (post.image_path) {
      post.image_url = `${req.protocol}://${req.get('host')}/uploads/images/${post.image_filename}`;
    }
    
    if (post.audio_path) {
      post.audio_url = `${req.protocol}://${req.get('host')}/uploads/audio/${post.audio_filename}`;
    }

    res.status(201).json({
      success: true,
      message: 'Post created successfully',
      data: post
    });

  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating post',
      error: error.message
    });
  }
});
```

### Get Posts Endpoint with File URLs

```javascript
// GET /api/posts - Get all posts
router.get('/posts', async (req, res) => {
  try {
    const query = `
      SELECT id, title, content, image_path, image_filename, 
             audio_path, audio_filename, created_at, updated_at
      FROM posts 
      ORDER BY created_at DESC
    `;
    
    const result = await pool.query(query);
    const posts = result.rows;

    // Add file URLs to each post
    const postsWithUrls = posts.map(post => {
      const postData = { ...post };
      
      // Add image URL if image exists
      if (post.image_path && post.image_filename) {
        postData.image_url = `${req.protocol}://${req.get('host')}/uploads/images/${post.image_filename}`;
      }
      
      // Add audio URL if audio exists
      if (post.audio_path && post.audio_filename) {
        postData.audio_url = `${req.protocol}://${req.get('host')}/uploads/audio/${post.audio_filename}`;
      }
      
      // Remove file paths from response for security
      delete postData.image_path;
      delete postData.audio_path;
      
      return postData;
    });

    res.json({
      success: true,
      data: postsWithUrls,
      count: posts.length
    });

  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching posts',
      error: error.message
    });
  }
});

// GET /api/posts/:id - Get single post
router.get('/posts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      SELECT id, title, content, image_path, image_filename, 
             audio_path, audio_filename, created_at, updated_at
      FROM posts 
      WHERE id = $1
    `;
    
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }
    
    const post = result.rows[0];
    
    // Add file URLs
    if (post.image_path && post.image_filename) {
      post.image_url = `${req.protocol}://${req.get('host')}/uploads/images/${post.image_filename}`;
    }
    
    if (post.audio_path && post.audio_filename) {
      post.audio_url = `${req.protocol}://${req.get('host')}/uploads/audio/${post.audio_filename}`;
    }
    
    // Remove file paths from response
    delete post.image_path;
    delete post.audio_path;

    res.json({
      success: true,
      data: post
    });

  } catch (error) {
    console.error('Error fetching post:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching post',
      error: error.message
    });
  }
});

module.exports = router;
```

## 4. Static File Serving

### Configure Express to Serve Static Files

```javascript
// app.js or server.js
const express = require('express');
const path = require('path');
const postsRouter = require('./routes/posts');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api', postsRouter);

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 10MB.'
      });
    }
  }
  
  res.status(500).json({
    success: false,
    message: error.message
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

## 5. Directory Structure

Your server directory structure should look like this:

```
your-server/
├── config/
│   ├── database.js
│   └── multer.js
├── routes/
│   └── posts.js
├── uploads/
│   ├── images/
│   └── audio/
├── app.js
└── package.json
```

## 6. Frontend Usage Examples

### HTML Form Example

```html
<form enctype="multipart/form-data">
  <input type="text" name="title" placeholder="Post title" required>
  <textarea name="content" placeholder="Post content"></textarea>
  <input type="file" name="image" accept="image/*">
  <input type="file" name="audio" accept="audio/*">
  <button type="submit">Create Post</button>
</form>
```

### JavaScript Fetch Example

```javascript
// Create post with files
const createPost = async (formData) => {
  try {
    const response = await fetch('/api/posts', {
      method: 'POST',
      body: formData // FormData object with files
    });
    
    const result = await response.json();
    console.log('Post created:', result);
  } catch (error) {
    console.error('Error:', error);
  }
};

// Get posts
const getPosts = async () => {
  try {
    const response = await fetch('/api/posts');
    const result = await response.json();
    
    result.data.forEach(post => {
      console.log('Post:', post.title);
      if (post.image_url) {
        console.log('Image URL:', post.image_url);
      }
      if (post.audio_url) {
        console.log('Audio URL:', post.audio_url);
      }
    });
  } catch (error) {
    console.error('Error:', error);
  }
};
```

## 7. Security Considerations

- **File Validation**: Always validate file types and sizes
- **Path Traversal**: Use proper path handling to prevent directory traversal attacks
- **File Permissions**: Set appropriate file permissions on the uploads directory
- **Rate Limiting**: Implement rate limiting for upload endpoints
- **Authentication**: Add authentication/authorization as needed

## 8. Best Practices

1. **Organize by File Type**: Store files in subdirectories (images/, audio/, etc.)
2. **Unique Filenames**: Use timestamps and random numbers to avoid conflicts
3. **Database Storage**: Store file metadata in database, files on filesystem
4. **Error Handling**: Proper error handling for file operations
5. **Cleanup**: Implement file cleanup for failed uploads
6. **Backup**: Regular backup of both database and uploaded files

This setup provides a robust file upload and retrieval system for your Node.js API with PostgreSQL database.