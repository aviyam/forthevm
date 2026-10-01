# ==========================================
# Stage 1: Build the React / Vite SPA
# Use --platform=$BUILDPLATFORM so the Node.js build runs natively on the host
# architecture (avoiding QEMU emulation and cross-architecture native binding issues)
# ==========================================
FROM --platform=$BUILDPLATFORM node:20-bookworm-slim AS builder

WORKDIR /app

# Copy package descriptor
COPY package.json ./

# Install dependencies for the build host
RUN npm install --legacy-peer-deps

# Copy application source code
COPY . .

# Build production static assets
RUN npm run build

# ==========================================
# Stage 2: Production Nginx Server
# Multi-architecture target (linux/amd64, linux/arm64)
# ==========================================
FROM nginx:alpine AS runner

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy compiled static assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose HTTP port
EXPOSE 80

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://localhost/healthz || exit 1

# Start Nginx server in foreground
CMD ["nginx", "-g", "daemon off;"]
