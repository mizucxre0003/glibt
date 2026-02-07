# Use Node.js LTS
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build the Next.js app
# Set env to production for build to avoid dev dependencies issues if any
ENV NODE_ENV=production
RUN npm run build

# Expose the port the app runs on
EXPOSE 3000

# Start the application
# We need to run the custom server
CMD ["npm", "start"]
