# ---- Stage 1: install deps ----
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# ---- Stage 2: build ----
FROM node:20-alpine AS builder
WORKDIR /app

# NEXT_PUBLIC_* vars are baked in at build time by Next.js — pass them as
# build args so the image can be built for any target environment.
ARG NEXT_PUBLIC_API_URL=http://localhost:4000
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ---- Stage 3: production image ----
# standalone output already contains everything needed — no node_modules.
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# The standalone build bundles its own minimal server.js and the
# required node_modules subset; static assets go in /public.
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
