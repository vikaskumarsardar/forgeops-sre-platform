# ==============================================================================
# FORGEOPS: PRODUCTION DOCKERFILE
# Multi-stage production container image build
# ==============================================================================

FROM node:20-alpine AS builder
WORKDIR /app

# Copy dependency definitions
COPY package*.json tsconfig.json ./

# Install dependencies
RUN npm ci

# Copy application source code
COPY . .

# Build Next.js 15 production bundle
RUN npm run build

# Stage 2: Production Minimal Runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Install git and kubectl for CLI fallback execution
RUN apk add --no-cache git curl && \
    curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl" && \
    chmod +x kubectl && mv kubectl /usr/local/bin/

# Copy production artifacts
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/src ./src
COPY --from=builder /app/tsconfig.json ./tsconfig.json

EXPOSE 3000 4000

# Start Express Backend API Server and Next.js Web UI
CMD ["sh", "-c", "npx tsx src/server/index.ts & npm start"]
