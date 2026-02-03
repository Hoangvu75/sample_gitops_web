# Sample GitOps Web — Next.js (custom server)
FROM node:20-alpine AS builder
# Install build dependencies for node-pty
RUN apk add --no-cache python3 make g++
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci && npm cache clean --force
COPY . .
RUN mkdir -p public
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Stage: Production Dependencies
# Install ONLY production dependencies (includes node-pty compilation)
FROM node:20-alpine AS deps-prod
RUN apk add --no-cache python3 make g++
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --only=production && npm cache clean --force

# Runner - minimal Alpine with kubectl
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# Install runtime dependencies for node-pty and kubectl
# Install runtime dependencies for node-pty and kubectl
RUN apk add --no-cache curl bash libstdc++ && \
    curl -LO "https://dl.k8s.io/release/v1.29.2/bin/linux/amd64/kubectl" && \
    chmod +x kubectl && \
    mv kubectl /usr/local/bin/ && \
    apk del curl && \
    rm -rf /var/cache/apk/* /tmp/*

# Copy artifacts
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
# Copy custom server
COPY --from=builder /app/custom-server.js ./custom-server.js
# Copy optimized prod node_modules from deps-prod stage
COPY --from=deps-prod /app/node_modules ./node_modules

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
USER node
CMD ["node", "custom-server.js"]