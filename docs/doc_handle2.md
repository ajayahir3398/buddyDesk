Nice — I’ll walk you through a practical, secure, production-ready approach for handling user uploads (images/audio) on a Linux server running a Node.js API + PostgreSQL. I’ll cover architecture choices, directory layout & permissions, DB schema, example Node/Express code (upload, serve, stream), security/validation, and scaling/backups. You can copy/paste the code and adapt it to your app.

# 1) High-level choices (pick one)

* **Local filesystem (simple)** — store files on disk (e.g. `/var/www/myapp/uploads`). Fast and cheap, easy to develop. Good for small apps or single server.
* **Cloud object storage (recommended for scale)** — S3 / DigitalOcean Spaces / GCS. Better for scale, CDN, backups, multi-server. Use signed URLs.
* **Database (NOT recommended for large media)** — store in `bytea`. Works but bloats DB and hurts performance.

I’ll show **local filesystem** examples (since you asked about server storage). If you later want S3, the code changes are small (upload to S3 and store the S3 key in DB).

# 2) Directory layout & permissions

Suggested layout:

```
/srv/myapp/
  ├─ uploads/
  │   ├─ images/
  │   └─ audio/
  └─ app/   (your node app)
```

Create & set ownership (example):

```bash
sudo useradd -r -s /usr/sbin/nologin nodeapp           # optional dedicated user
sudo mkdir -p /srv/myapp/uploads/images /srv/myapp/uploads/audio
sudo chown -R nodeapp:nodeapp /srv/myapp/uploads
sudo chmod -R 750 /srv/myapp/uploads
```

If you use nginx to serve files, make sure nginx user (often `www-data`) has read access or use nginx `alias` and adjust group ownership.

# 3) Database schema (store metadata, not raw files)

Example `posts` table:

```sql
CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  user_id INT,                 -- optional
  title TEXT,
  body TEXT,
  image_filename TEXT,         -- e.g. images/uuid.jpg
  image_mime TEXT,
  image_size INT,
  audio_filename TEXT,         -- e.g. audio/uuid.mp3
  audio_mime TEXT,
  audio_size INT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

Store only a *relative* path or filename (not absolute path). Also store mime/size for convenience.

# 4) Example Node.js (Express) implementation

Dependencies:

```
npm i express multer uuid pg dotenv
```

`server.js` (complete example — adapt to your project):

```js
require('dotenv').config();
const express = require('express');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const { Pool } = require('pg');

const app = express();
const pool = new Pool({ connectionString: process.env.DATABASE_URL }); // set env
const PORT = process.env.PORT || 3000;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`; // set to public URL in prod
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, '..', 'uploads');

const IMAGE_DIR = path.join(UPLOAD_DIR, 'images');
const AUDIO_DIR = path.join(UPLOAD_DIR, 'audio');

// ensure directories exist
[UPLOAD_DIR, IMAGE_DIR, AUDIO_DIR].forEach(d => fs.mkdirSync(d, { recursive: true }));

// multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'image') cb(null, IMAGE_DIR);
    else if (file.fieldname === 'audio') cb(null, AUDIO_DIR);
    else cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, uuidv4() + ext); // use UUID to avoid collisions & sanitize
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB limit (adjust)
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'image') {
      if (!file.mimetype.startsWith('image/')) return cb(new Error('Invalid image file'));
    }
    if (file.fieldname === 'audio') {
      if (!file.mimetype.startsWith('audio/')) return cb(new Error('Invalid audio file'));
    }
    cb(null, true);
  }
});

// Serve static files publicly (if you want public access)
app.use('/uploads', express.static(UPLOAD_DIR)); // URL: /uploads/images/uuid.jpg

app.post('/posts', upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'audio', maxCount: 1 }
]), async (req, res) => {
  try {
    const { title, body } = req.body;
    const image = req.files?.image?.[0];
    const audio = req.files?.audio?.[0];

    const image_filename = image ? `images/${path.basename(image.path)}` : null;
    const audio_filename = audio ? `audio/${path.basename(audio.path)}` : null;

    const result = await pool.query(
      `INSERT INTO posts (title, body, image_filename, image_mime, image_size, audio_filename, audio_mime, audio_size)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [title, body, image_filename, image?.mimetype, image?.size, audio_filename, audio?.mimetype, audio?.size]
    );

    const post = result.rows[0];
    if (post.image_filename) post.image_url = `${BASE_URL}/uploads/${post.image_filename}`;
    if (post.audio_filename) post.audio_url = `${BASE_URL}/uploads/${post.audio_filename}`;

    res.status(201).json({ post });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Get posts (include file URLs)
app.get('/posts', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM posts ORDER BY created_at DESC');
    const posts = result.rows.map(p => {
      if (p.image_filename) p.image_url = `${BASE_URL}/uploads/${p.image_filename}`;
      if (p.audio_filename) p.audio_url = `${BASE_URL}/uploads/${p.audio_filename}`;
      return p;
    });
    res.json({ posts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Optional: protected streaming endpoint with Range support for audio
app.get('/stream/audio/:filename', async (req, res) => {
  try {
    // If private, verify user here (req.user) and ownership
    const filename = req.params.filename;
    const filePath = path.join(AUDIO_DIR, path.basename(filename));
    if (!fs.existsSync(filePath)) return res.sendStatus(404);

    const stat = fs.statSync(filePath);
    const range = req.headers.range;
    const total = stat.size;
    if (!range) {
      res.writeHead(200, {
        'Content-Length': total,
        'Content-Type': 'audio/mpeg',
        'Accept-Ranges': 'bytes'
      });
      fs.createReadStream(filePath).pipe(res);
    } else {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : total - 1;
      const chunkSize = end - start + 1;
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${total}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': 'audio/mpeg'
      });
      fs.createReadStream(filePath, { start, end }).pipe(res);
    }
  } catch (err) {
    console.error(err);
    res.status(500).end();
  }
});

app.listen(PORT, () => console.log(`Server ${PORT}`));
```

**Notes on the code above**

* Files are saved under `uploads/images/` and `uploads/audio/` with UUID filenames.
* DB stores `images/<filename>` and `audio/<filename>` (relative paths).
* `app.use('/uploads', express.static(...))` exposes files at `https://yourdomain/uploads/images/uuid.jpg`.
* For security/private files, don’t expose `uploads` publicly; serve through an authenticated endpoint (like `/stream/audio/:filename`) that checks ownership and streams bytes (supports Range requests for audio players).

# 5) How the client uses the API

Upload with `curl`:

```bash
curl -X POST \
  -F "title=Hello" -F "body=desc" \
  -F "image=@/path/to/photo.jpg" \
  -F "audio=@/path/to/song.mp3" \
  https://yourdomain/api/posts
```

Fetch posts:

```
GET https://yourdomain/api/posts
Response JSON will include:
{
  posts: [
    {
      id: 1,
      title: "Hello",
      image_url: "https://yourdomain/uploads/images/uuid.jpg",
      audio_url: "https://yourdomain/uploads/audio/uuid.mp3",
      ...
    }
  ]
}
```

The frontend can directly use `image_url` for `<img src=...>` and `audio_url` for `<audio src=...>` — unless you need access checks, in which case route audio through protected stream endpoint.

# 6) Security + validation checklist (must-haves)

* **MIME & extension validation** (already in code).
* **File size limits** (set in multer `limits`).
* **Filename hygiene** — use UUIDs, not client-provided names.
* **Directory traversal protection** — use `path.basename` when reading requested names.
* **Virus/malware scanning** (ClamAV) if accepting public files.
* **Rate limiting** (prevent upload abuse).
* **HTTPS** — always use TLS.
* **Auth & ownership checks** when files are private — do not serve public `uploads` directory.
* **Content Security Policy** on frontend if needed.

# 7) Performance & scaling

* If traffic grows:

  * Move uploads to **S3** (or other object storage). Store keys in DB. Serve via CDN or signed URLs.
  * Use Nginx to serve static files (more efficient than Node for static assets).
  * Offload streaming to Nginx with `X-Accel-Redirect` for protected files.
* Backups: periodically sync `/srv/myapp/uploads` to remote storage (`aws s3 sync` / `rsync`).
* Monitor disk space and set alerts. Consider quotas per-user.

# 8) Alternative: store media in PostgreSQL (bytea)

* Possible but not optimal for large files. If you need it:

  * Use a `bytea` column and insert Buffer from Node. Retrieval requires streaming and can increase DB size/backups.
* Generally prefer object storage or filesystem.

# 9) Nginx example (serve uploads via alias)

If you use nginx in front:

```
location /uploads/ {
    alias /srv/myapp/uploads/;
    access_log off;
    expires max;
}
```

If files are private, instead of direct alias serve them via Node with auth, or use `X-Accel-Redirect` to let nginx serve after your app authorizes.

---

If you want, I can:

* Convert the example into a small runnable repo structure,
* Add S3 upload code + signed URL generation,
* Or create the exact SQL migration for your DB.

Tell me which of those you want and I’ll produce it directly.
