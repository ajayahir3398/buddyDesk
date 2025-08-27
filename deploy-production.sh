#!/bin/bash

echo "🚀 Deploying BuddyDesk to Production..."
echo "========================================"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found! Please create it with your database credentials."
    exit 1
fi

# Create necessary directories with proper permissions
echo "📁 Creating directory structure..."
mkdir -p uploads/images uploads/audio uploads/documents uploads/posts logs

# Set proper permissions for Docker container (UID 1001 = nodejs user)
echo "🔐 Setting file permissions for Docker container..."
chmod -R 755 uploads logs
chown -R 1001:1001 uploads logs 2>/dev/null || {
    echo "⚠️  Using sudo to set ownership..."
    sudo chown -R 1001:1001 uploads logs
}

# Verify permissions
echo "📋 Verifying permissions..."
ls -la uploads/ | head -5
echo "..."

# Stop and remove existing containers
echo "🛑 Stopping existing containers..."
docker stop buddydesk-app 2>/dev/null || echo "No existing container to stop"
docker rm buddydesk-app 2>/dev/null || echo "No existing container to remove"

# Remove old image
echo "🧹 Cleaning up old images..."
docker rmi buddydesk 2>/dev/null || echo "No old image to remove"

# Build new image
echo "🔨 Building new Docker image..."
docker build -t buddydesk .

if [ $? -ne 0 ]; then
    echo "❌ Docker build failed!"
    exit 1
fi

# Run the container with proper environment and permissions
echo "🚀 Starting new container..."
docker run -d \
    --name buddydesk-app \
    -p 3000:3000 \
    --env-file .env \
    -v "$(pwd)/uploads:/app/uploads" \
    -v "$(pwd)/logs:/app/logs" \
    --restart unless-stopped \
    buddydesk

if [ $? -ne 0 ]; then
    echo "❌ Failed to start container!"
    exit 1
fi

# Wait for container to be ready
echo "⏳ Waiting for application to start..."
sleep 10

# Check container status
if docker ps | grep -q buddydesk-app; then
    echo "✅ Container is running!"
    
    # Check application health
    echo "🏥 Checking application health..."
    if curl -f http://localhost:3000/health > /dev/null 2>&1; then
        echo "✅ Application is healthy and responding!"
    else
        echo "⚠️  Application may still be starting up..."
    fi
    
    # Show container info
    echo ""
    echo "📊 Container Information:"
    docker ps | grep buddydesk-app
    echo ""
    echo "📝 Container logs:"
    docker logs --tail 20 buddydesk-app
    
    echo ""
    echo "🎉 Deployment completed successfully!"
    echo "🌐 Application is available at: http://localhost:3000"
    echo "📚 API Documentation: http://localhost:3000/api-docs"
    
else
    echo "❌ Container failed to start!"
    echo "📝 Container logs:"
    docker logs buddydesk-app
    exit 1
fi

echo ""
echo "🔧 Useful commands:"
echo "  View logs: docker logs -f buddydesk-app"
echo "  Stop app:  docker stop buddydesk-app"
echo "  Restart:   docker restart buddydesk-app"
echo "  Shell:     docker exec -it buddydesk-app sh"
echo ""
echo "📁 File permissions fixed for uploads directory"
echo "🔑 Environment variables loaded from .env file"
