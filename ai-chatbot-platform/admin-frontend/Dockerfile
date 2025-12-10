# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build arguments for Vite (these become environment variables during build)
ARG VITE_POCKETBASE_URL
ARG VITE_MIDDLEWARE_URL

# Set environment variables for the build
ENV VITE_POCKETBASE_URL=$VITE_POCKETBASE_URL
ENV VITE_MIDDLEWARE_URL=$VITE_MIDDLEWARE_URL

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built files to nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx config for SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
