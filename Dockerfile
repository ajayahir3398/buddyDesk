# Use official Node.js LTS base image
FROM node:20-alpine

# Install necessary packages for file operations
RUN apk add --no-cache \
    bash \
    su-exec \
    && rm -rf /var/cache/apk/*

# Create app user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy the rest of your application code
COPY . .

# Create uploads directory structure with proper permissions
RUN mkdir -p /app/uploads/images \
    /app/uploads/audio \
    /app/uploads/documents \
    /app/logs

# Set proper ownership and permissions
RUN chown -R nodejs:nodejs /app && \
    chmod -R 755 /app/uploads && \
    chmod -R 755 /app/logs

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })" || exit 1

# Start the application
CMD ["npm", "start"]
