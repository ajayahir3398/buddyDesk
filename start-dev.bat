@echo off
echo 🚀 Starting BuddyDesk in Development Mode...
echo =============================================

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if npm is available
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm is not available
    pause
    exit /b 1
)

REM Create necessary directories if they don't exist
echo 📁 Setting up development directories...
if not exist "uploads\images" mkdir "uploads\images"
if not exist "uploads\audio" mkdir "uploads\audio"
if not exist "uploads\documents" mkdir "uploads\documents"
if not exist "uploads\posts" mkdir "uploads\posts"
if not exist "logs" mkdir "logs"

REM Check if dependencies are installed
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    npm install
    if %errorlevel% neq 0 (
        echo ❌ Failed to install dependencies
        pause
        exit /b 1
    )
)

echo ✅ Development environment ready!
echo.
echo 🎯 Available commands:
echo   npm run dev          - Start with nodemon (auto-restart)
echo   npm run dev:debug    - Start with debugger
echo   npm run dev:watch    - Start with file watching
echo   npm start            - Start without nodemon
echo.
echo 🐳 Docker Development:
echo   npm run docker:dev   - Start with Docker
echo   npm run docker:dev:down - Stop Docker
echo.
echo 🗄️  Database:
echo   npm run db:migrate   - Run database migration
echo.

echo 🚀 Starting development server...
echo Press Ctrl+C to stop
echo.

REM Start development server
npm run dev
