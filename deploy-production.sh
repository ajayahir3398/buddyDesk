#!/bin/bash

echo "🚀 Deploying BuddyDesk to Production..."
echo "========================================"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Create necessary directories with proper permissions
echo "📁 Creating directory structure..."
mkdir -p uploads/images uploads/audio uploads/documents uploads/posts logs

# Set proper permissions (adjust user/group as needed for your server)
echo "🔐 Setting file permissions..."
chmod -R 755 uploads logs
chown -R $USER:$USER uploads logs 2>/dev/null || echo "⚠️  Could not set ownership (may need sudo)"

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

# Run the container
echo "🚀 Starting new container..."
docker run -d \
    --name buddydesk-app \
    -p 3000:3000 \
    -e NODE_ENV=production \
    -e PORT=3000 \
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
