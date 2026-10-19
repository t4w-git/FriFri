FROM node:20-slim AS frontend-build

WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci --legacy-peer-deps

COPY frontend/ ./
RUN mkdir -p /app/backend
RUN npm run build

FROM node:20-slim AS backend-build

WORKDIR /app/backend

RUN apt-get update -y \
  && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

COPY backend/package*.json ./
COPY backend/prisma ./prisma
RUN npm ci --legacy-peer-deps

COPY backend/ ./
COPY --from=frontend-build /app/backend/public ./public

RUN npm run build

FROM node:20-slim AS runtime

WORKDIR /app

ENV NODE_ENV=production

RUN apt-get update -y \
  && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

COPY backend/package*.json ./
COPY backend/prisma ./prisma
RUN npm ci --omit=dev --ignore-scripts --legacy-peer-deps \
  && test -x ./node_modules/.bin/prisma

COPY --from=backend-build /app/backend/node_modules/.prisma ./node_modules/.prisma
COPY --from=backend-build /app/backend/dist ./dist
COPY --from=backend-build /app/backend/public ./public

RUN mkdir -p /app/uploads

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 3000) + '/health').then(r => { if (!r.ok) process.exit(1) }).catch(() => process.exit(1))"

# Keep an imported legacy MySQL dump compatible with the current Prisma schema.
# db push is intentionally run without --accept-data-loss so destructive drift
# stops the deployment instead of silently dropping production data.
CMD ["sh", "-c", "./node_modules/.bin/prisma db push --skip-generate && node dist/server.js"]
