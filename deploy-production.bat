@echo off
echo 🚀 Deploying BuddyDesk to Production...
echo ========================================

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not running. Please start Docker and try again.
    pause
    exit /b 1
)

REM Create necessary directories
echo 📁 Creating directory structure...
if not exist "uploads\images" mkdir "uploads\images"
if not exist "uploads\audio" mkdir "uploads\audio"
if not exist "uploads\documents" mkdir "uploads\documents"
if not exist "uploads\posts" mkdir "uploads\posts"
if not exist "logs" mkdir "logs"

REM Stop and remove existing containers
echo 🛑 Stopping existing containers...
docker stop buddydesk-app 2>nul
docker rm buddydesk-app 2>nul

REM Remove old image
echo 🧹 Cleaning up old images...
docker rmi buddydesk 2>nul

REM Build new image
echo 🔨 Building new Docker image...
docker build -t buddydesk .
if %errorlevel% neq 0 (
    echo ❌ Docker build failed!
    pause
    exit /b 1
)

REM Run the container
echo 🚀 Starting new container...
docker run -d ^
    --name buddydesk-app ^
    -p 3000:3000 ^
    -e NODE_ENV=production ^
    -e PORT=3000 ^
    -v "%cd%\uploads:/app/uploads" ^
    -v "%cd%\logs:/app/logs" ^
    --restart unless-stopped ^
    buddydesk

if %errorlevel% neq 0 (
    echo ❌ Failed to start container!
    pause
    exit /b 1
)

REM Wait for container to be ready
echo ⏳ Waiting for application to start...
timeout /t 10 /nobreak >nul

REM Check container status
docker ps | findstr buddydesk-app >nul
if %errorlevel% equ 0 (
    echo ✅ Container is running!
    
    REM Check application health
    echo 🏥 Checking application health...
    powershell -Command "try { Invoke-WebRequest -Uri 'http://localhost:3000/health' -UseBasicParsing | Out-Null; Write-Host '✅ Application is healthy and responding!' } catch { Write-Host '⚠️  Application may still be starting up...' }"
    
    REM Show container info
    echo.
    echo 📊 Container Information:
    docker ps | findstr buddydesk-app
    echo.
    echo 📝 Container logs:
    docker logs --tail 20 buddydesk-app
    
    echo.
    echo 🎉 Deployment completed successfully!
    echo 🌐 Application is available at: http://localhost:3000
    echo 📚 API Documentation: http://localhost:3000/api-docs
    
) else (
    echo ❌ Container failed to start!
    echo 📝 Container logs:
    docker logs buddydesk-app
    pause
    exit /b 1
)

echo.
echo 🔧 Useful commands:
echo   View logs: docker logs -f buddydesk-app
echo   Stop app:  docker stop buddydesk-app
echo   Restart:   docker restart buddydesk-app
echo   Shell:     docker exec -it buddydesk-app sh

pause
