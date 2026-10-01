# ─── Stage 1: Build ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package descriptors
COPY package*.json tsconfig*.json vite.config.ts ./

# Install dependencies
RUN npm ci

# Copy source code and assets
COPY public/ ./public/
COPY src/ ./src/
COPY index.html ./

# Build production bundle
RUN npm run build

# ─── Stage 2: Nginx Runner ───────────────────────────────────────────────────
FROM nginx:1.27-alpine AS runner

# Remove default nginx html
RUN rm -rf /usr/share/nginx/html/*

# Copy built assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
