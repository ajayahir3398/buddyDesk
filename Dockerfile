# Use official Node.js LTS base image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of your application code
COPY . .

# Expose port (adjust if your app uses a different port)
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
