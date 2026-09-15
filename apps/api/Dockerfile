# ---- Stage 1: install all deps + compile ----
FROM node:20-alpine AS builder
WORKDIR /app

# Copy manifests first so Docker can cache the npm install layer
# independently from source code changes.
COPY package*.json ./
RUN npm ci

# Generate Prisma client (writes to node_modules/.prisma) — must happen
# before compiling because compiled code imports from @prisma/client.
COPY prisma ./prisma
RUN npx prisma generate

# Compile TypeScript → dist/
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ---- Stage 2: production image ----
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Only production deps — no devDependencies in the final image.
COPY package*.json ./
RUN npm ci --omit=dev

# Copy the generated Prisma client from the builder (it lives inside
# node_modules/.prisma, which npm ci --omit=dev doesn't generate).
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Compiled application and Prisma schema (needed for migrate deploy).
COPY --from=builder /app/dist ./dist
COPY prisma ./prisma

EXPOSE 4000

# Run pending migrations before starting the server.
# `migrate deploy` is idempotent — safe to run on every container start.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
