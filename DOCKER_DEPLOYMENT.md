# 🐳 Docker Deployment Guide for BuddyDesk

This guide covers deploying BuddyDesk with the enhanced file handling system using Docker.

## 🚀 Quick Start (Recommended)

### Option 1: Use Deployment Scripts (Easiest)

**Linux/Mac:**
```bash
chmod +x deploy-production.sh
./deploy-production.sh
```

**Windows:**
```cmd
deploy-production.bat
```

### Option 2: Manual Docker Commands

```bash
# Create directories
mkdir -p uploads/images uploads/audio uploads/documents uploads/posts logs

# Set permissions
chmod -R 755 uploads logs

# Build and run
docker build -t buddydesk .
docker run -d \
    --name buddydesk-app \
    -p 3000:3000 \
    -e NODE_ENV=production \
    -e PORT=3000 \
    -v "$(pwd)/uploads:/app/uploads" \
    -v "$(pwd)/logs:/app/logs" \
    --restart unless-stopped \
    buddydesk
```

## 🔧 Docker Compose (Recommended for Production)

```bash
# Start with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

## 📁 Directory Structure

The deployment creates this structure on your host machine:

```
your-project/
├── uploads/
│   ├── images/          # Image files
│   ├── audio/           # Audio files
│   ├── documents/       # Document files
│   └── posts/           # Legacy/fallback files
├── logs/                # Application logs
├── Dockerfile           # Container configuration
├── docker-compose.yml   # Multi-container setup
└── deploy-*.sh/bat     # Deployment scripts
```

## 🔐 File Permissions

**Linux/Mac:**
```bash
# Set proper ownership (adjust user/group as needed)
sudo chown -R $USER:$USER uploads logs
chmod -R 755 uploads logs
```

**Windows:**
- Right-click folders → Properties → Security
- Ensure your user has Full Control permissions

## 🚨 Important Security Notes

1. **File Persistence**: Uploads are stored on the host machine via volumes
2. **User Isolation**: Container runs as non-root user (nodejs:1001)
3. **Health Checks**: Built-in health monitoring
4. **Restart Policy**: Automatic restart on failure

## 🔍 Troubleshooting

### Container Won't Start
```bash
# Check logs
docker logs buddydesk-app

# Check container status
docker ps -a

# Verify directory permissions
ls -la uploads/ logs/
```

### File Upload Issues
```bash
# Check uploads directory permissions
docker exec -it buddydesk-app ls -la /app/uploads

# Verify directory structure
docker exec -it buddydesk-app find /app/uploads -type d
```

### Database Migration
```bash
# Run migration inside container
docker exec -it buddydesk-app node scripts/add-file-category-migration.js
```

## 📊 Monitoring

### Health Check
```bash
# Manual health check
curl http://localhost:3000/health

# Container health status
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

### Logs
```bash
# Follow logs in real-time
docker logs -f buddydesk-app

# View last 100 lines
docker logs --tail 100 buddydesk-app
```

## 🔄 Updates and Maintenance

### Update Application
```bash
# Stop container
docker stop buddydesk-app

# Remove container
docker rm buddydesk-app

# Rebuild and restart
docker build -t buddydesk .
docker run -d --name buddydesk-app -p 3000:3000 \
    -v "$(pwd)/uploads:/app/uploads" \
    -v "$(pwd)/logs:/app/logs" \
    --restart unless-stopped buddydesk
```

### Backup Uploads
```bash
# Create backup
tar -czf uploads-backup-$(date +%Y%m%d).tar.gz uploads/

# Restore backup
tar -xzf uploads-backup-YYYYMMDD.tar.gz
```

## 🌐 Production Considerations

### Environment Variables
```bash
# Create .env file
NODE_ENV=production
PORT=3000
DATABASE_URL=your_database_connection_string
```

### Reverse Proxy (Nginx)
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    # Serve uploads directly (optional)
    location /uploads/ {
        alias /path/to/your/uploads/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### SSL/HTTPS
```bash
# Use Let's Encrypt with Certbot
sudo certbot --nginx -d yourdomain.com
```

## 📋 Pre-deployment Checklist

- [ ] Database migration script ready
- [ ] Environment variables configured
- [ ] Directory permissions set correctly
- [ ] Docker and Docker Compose installed
- [ ] Port 3000 available
- [ ] Database connection configured
- [ ] SSL certificates ready (if using HTTPS)

## 🆘 Support Commands

```bash
# Get container info
docker inspect buddydesk-app

# Access container shell
docker exec -it buddydesk-app sh

# Check resource usage
docker stats buddydesk-app

# View container processes
docker top buddydesk-app
```

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Node.js Docker Best Practices](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)

---

**Need Help?** Check the logs first: `docker logs buddydesk-app`
