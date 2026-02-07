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
# Start the application using standalone build
# This requires copying the standalone folder and static files
# But since we use a custom server, we need to point to it differently or stick to custom server with optimized build
# For custom server + standalone, it's tricky.
# Let's try to increase node memory limit first as it is the easiest fix for "Heaps"
ENV NODE_OPTIONS="--max-old-space-size=512"

RUN npm run build

# Start the application
CMD ["npm", "start"]
