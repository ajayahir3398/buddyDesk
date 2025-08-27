Perfect! Let me show you how to deploy this code on your server using Docker after pulling from Git. Here's the complete server deployment process:

## **🚀 Server Deployment Process**

### **Step 1: On Your Local Machine (Push to Git)**

```bash
# Add all changes
git add .

# Commit the enhanced file handling system
git commit -m "feat: Enhanced file handling system with Docker support

- Added organized file upload structure (images/, audio/, documents/, posts/)
- Implemented UUID-based filenames for security
- Added file category tracking in database
- Enhanced file serving with streaming support
- Added Docker deployment scripts and configuration
- Updated PostAttachment model with file_category field
- Added comprehensive deployment documentation"

# Push to your repository
git push origin main
```

### **Step 2: On Your Server (Pull and Deploy)**

#### **Option A: Use Deployment Scripts (Recommended)**

```bash
# 1. Navigate to your project directory
cd /path/to/your/project

# 2. Pull latest code
git pull origin main

# 3. Make deployment script executable (Linux/Mac)
chmod +x deploy-production.sh

# 4. Run deployment script
./deploy-production.sh
```

#### **Option B: Manual Docker Commands**

```bash
# 1. Pull latest code
git pull origin main

# 2. Create necessary directories
mkdir -p uploads/images uploads/audio uploads/documents uploads/posts logs

# 3. Set proper permissions
chmod -R 755 uploads logs

# 4. Build and run Docker container
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

#### **Option C: Use Docker Compose (Production Recommended)**

```bash
# 1. Pull latest code
git pull origin main

# 2. Create directories and set permissions
mkdir -p uploads/images uploads/audio uploads/documents uploads/posts logs
chmod -R 755 uploads logs

# 3. Start with Docker Compose
docker-compose up -d

# 4. Check status
docker-compose ps
docker-compose logs -f
```

## **🔧 Server-Side Setup Requirements**

### **1. Install Docker on Server**

**Ubuntu/Debian:**
```bash
# Update package index
sudo apt-get update

# Install prerequisites
sudo apt-get install apt-transport-https ca-certificates curl gnupg lsb-release

# Add Docker's official GPG key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Add Docker repository
echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker
sudo apt-get update
sudo apt-get install docker-ce docker-ce-cli containerd.io

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Add user to docker group
sudo usermod -aG docker $USER
```

**CentOS/RHEL:**
```bash
# Install Docker
sudo yum install -y yum-utils
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
sudo yum install docker-ce docker-ce-cli containerd.io

# Start and enable Docker
sudo systemctl start docker
sudo systemctl enable docker

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### **2. Server Environment Variables**

Create a `.env` file on your server:

```bash
# Create environment file
cat > .env << 'EOF'
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://username:password@localhost:5432/buddydesk
JWT_SECRET=your_very_secure_jwt_secret_here
JWT_EXPIRES_IN=24h
MAX_FILE_SIZE=25MB
UPLOAD_PATH=./uploads
LOG_LEVEL=info
LOG_FILE=./logs/production.log
EOF
```

## **📋 Complete Server Deployment Checklist**

### **Pre-Deployment**
- [ ] Docker installed on server
- [ ] Docker Compose installed
- [ ] Git repository accessible
- [ ] Database connection configured
- [ ] Port 3000 available
- [ ] Server has sufficient disk space

### **Deployment Steps**
- [ ] Pull latest code: `git pull origin main`
- [ ] Create directories: `mkdir -p uploads/* logs`
- [ ] Set permissions: `chmod -R 755 uploads logs`
- [ ] Build Docker image: `docker build -t buddydesk .`
- [ ] Run container with volumes
- [ ] Run database migration
- [ ] Verify application health

### **Post-Deployment**
- [ ] Check container status: `docker ps`
- [ ] Verify logs: `docker logs buddydesk-app`
- [ ] Test health endpoint: `curl http://localhost:3000/health`
- [ ] Test file upload functionality
- [ ] Monitor resource usage: `docker stats`

## **🚨 Important Server Considerations**

### **1. File Persistence**
```bash
# Ensure uploads directory is mounted as volume
-v "$(pwd)/uploads:/app/uploads"
-v "$(pwd)/logs:/app/logs"
```

### **2. Database Migration**
```bash
# Run migration after container starts
docker exec -it buddydesk-app node scripts/add-file-category-migration.js
```

### **3. Monitoring and Logs**
```bash
# Follow logs in real-time
docker logs -f buddydesk-app

# Check container health
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

### **4. Backup Strategy**
```bash
# Backup uploads directory
tar -czf uploads-backup-$(date +%Y%m%d).tar.gz uploads/

# Backup logs
tar -czf logs-backup-$(date +%Y%m%d).tar.gz logs/
```

## **🔧 Quick Server Deployment Commands**

### **One-Line Deployment (Linux/Mac)**
```bash
git pull origin main && mkdir -p uploads/{images,audio,documents,posts} logs && chmod -R 755 uploads logs && docker build -t buddydesk . && docker run -d --name buddydesk-app -p 3000:3000 -e NODE_ENV=production -v "$(pwd)/uploads:/app/uploads" -v "$(pwd)/logs:/app/logs" --restart unless-stopped buddydesk
```

### **Docker Compose Deployment**
```bash
git pull origin main && mkdir -p uploads/{images,audio,documents,posts} logs && chmod -R 755 uploads logs && docker-compose up -d
```

## **📊 Deployment Status Monitoring**

```bash
# Check deployment status
echo "=== Container Status ==="
docker ps

echo "=== Application Health ==="
curl -s http://localhost:3000/health

echo "=== Directory Structure ==="
ls -la uploads/
ls -la logs/

echo "=== Resource Usage ==="
docker stats --no-stream
```

## **🎯 Summary**

**To deploy on server:**

1. **Push to Git** from your local machine
2. **Pull on server**: `git pull origin main`
3. **Create directories**: `mkdir -p uploads/* logs`
4. **Set permissions**: `chmod -R 755 uploads logs`
5. **Deploy with Docker**: Use `deploy-production.sh` or `docker-compose up -d`
6. **Run migration**: `docker exec -it buddydesk-app npm run db:migrate`
7. **Verify deployment**: Check health endpoint and logs

**The enhanced file handling system will automatically:**
- ✅ Organize files by type (images/, audio/, documents/, posts/)
- ✅ Use UUID-based filenames for security
- ✅ Track file categories in database
- ✅ Provide enhanced file serving with streaming
- ✅ Maintain file persistence across container restarts

**Would you like me to help you with any specific part of the server deployment process?**