FROM node:24-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@12.4.2 --activate
RUN apt-get update && apt-get install curl -y && rm -rf /var/lib/apt/lists/*
WORKDIR /app

FROM base AS dependencies
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/db/package.json ./packages/db/
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

FROM base AS builder
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=dependencies /app/packages/db/node_modules ./packages/db/node_modules
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/db ./packages/db
COPY apps/api ./apps/api

RUN pnpm --filter @teamlyf/db build
WORKDIR /app/apps/api
RUN pnpm build

FROM base AS runner
WORKDIR /app/apps/api
ENV NODE_ENV=production
ENV API_PORT=3101
EXPOSE 3101

HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:3101/docs-json || exit 1

COPY --from=dependencies /app/node_modules /app/node_modules
COPY --from=dependencies /app/apps/api/node_modules ./node_modules

COPY --from=dependencies /app/packages/db/node_modules /app/packages/db/node_modules
COPY --from=builder /app/apps/api/dist ./dist

COPY --from=builder /app/packages/db /app/packages/db
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml /app/
COPY apps/api/package.json ./

USER node
CMD ["sh", "-c", "cd /app/packages/db && ./node_modules/.bin/drizzle-kit migrate && node dist/main.js"]