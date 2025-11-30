ARG DATABASE_URL=mongodb://localhost:27017/thanos
ARG APP_VERSION

FROM node:20-alpine AS base
ARG DATABASE_URL
ARG APP_VERSION
ENV DATABASE_URL=${DATABASE_URL}
WORKDIR /app
# Required by Prisma on Alpine
RUN apk add --no-cache openssl

FROM base AS deps
ARG APP_VERSION
ARG DATABASE_URL
COPY package*.json ./
ENV DATABASE_URL=${DATABASE_URL}
RUN npm ci

FROM deps AS builder
ARG APP_VERSION
ARG DATABASE_URL
ENV DATABASE_URL=${DATABASE_URL}
COPY . .
RUN npm run build && npx prisma generate
# Keep only production dependencies
RUN npm prune --omit=dev

FROM base AS production
ENV NODE_ENV=production
WORKDIR /app
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/generated ./generated
COPY --from=builder /app/prisma ./prisma
EXPOSE 3000
CMD ["node", "dist/main"]
