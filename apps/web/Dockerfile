# Teamlyf web — TanStack Start SSR bundle served by workerd.
# Context: repository root (same as the API image).
FROM node:24-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@12.4.2 --activate
RUN apt-get update && apt-get install curl -y && rm -rf /var/lib/apt/lists/*
WORKDIR /app

FROM base AS dependencies
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

FROM base AS builder
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/apps/web/node_modules ./apps/web/node_modules
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web ./apps/web
WORKDIR /app/apps/web

# VITE_* values are inlined into the client bundle, so they are build args and
# not runtime env. Deploy-time API origins are passed by the deploy-web job.
ARG VITE_API_URL
ARG VITE_WS_URL
ARG VITE_LIVEKIT_URL
ENV VITE_API_URL=$VITE_API_URL \
    VITE_WS_URL=$VITE_WS_URL \
    VITE_LIVEKIT_URL=$VITE_LIVEKIT_URL
RUN pnpm build

FROM base AS runner
WORKDIR /app/apps/web
ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

# Liveness only (/): the SSR shell answers 200 without touching the API.
HEALTHCHECK --interval=30s --timeout=5s --start-period=45s --retries=3 \
  CMD curl -f http://localhost:3000/ || exit 1

COPY --from=dependencies /app/node_modules /app/node_modules
COPY --from=dependencies /app/apps/web/node_modules ./node_modules
COPY --from=builder /app/apps/web/dist ./dist
# Runtime config: main/assets point at the built bundle, unlike wrangler.jsonc
# which names the source entry for the Cloudflare build.
COPY apps/web/wrangler.docker.jsonc ./wrangler.docker.jsonc

USER node
# workerd is the runtime the bundle was compiled against; plain `node dist/...`
# cannot execute it. --ip 0.0.0.0 so Traefik can reach it inside the container.
CMD ["sh", "-c", "pnpm exec wrangler dev --config wrangler.docker.jsonc --ip 0.0.0.0 --port ${PORT} --local"]