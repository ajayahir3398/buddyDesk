#!/bin/bash

echo "🚀 Starting BuddyDesk in Development Mode..."
echo "============================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed or not in PATH"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

# Check if npm is available
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not available"
    exit 1
fi

# Create necessary directories if they don't exist
echo "📁 Setting up development directories..."
mkdir -p uploads/images uploads/audio uploads/documents uploads/posts logs

# Set proper permissions
chmod -R 755 uploads logs

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install dependencies"
        exit 1
    fi
fi

echo "✅ Development environment ready!"
echo ""
echo "🎯 Available commands:"
echo "  npm run dev          - Start with nodemon (auto-restart)"
echo "  npm run dev:debug    - Start with debugger"
echo "  npm run dev:watch    - Start with file watching"
echo "  npm start            - Start without nodemon"
echo ""
echo "🐳 Docker Development:"
echo "  npm run docker:dev   - Start with Docker"
echo "  npm run docker:dev:down - Stop Docker"
echo ""
echo "🗄️  Database:"
echo "  npm run db:migrate   - Run database migration"
echo ""

echo "🚀 Starting development server..."
echo "Press Ctrl+C to stop"
echo ""

# Start development server
npm run dev
