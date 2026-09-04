FROM node:20-alpine AS base

# 1. Install dependencies only when needed
# FROM base AS deps
# RUN apk add --no-cache libc6-compat
FROM base AS deps

WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json ./
RUN npm install --legacy-peer-deps

# 2. Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build arg for the API URL – passed in from docker-compose
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

# Build arg for server-side proxy destination (Next.js rewrites in next.config.ts)
# Default to http://traefik for Docker deployments
ARG BACKEND_URL=http://traefik
ENV BACKEND_URL=${BACKEND_URL}

RUN npm run build

# 3. Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
