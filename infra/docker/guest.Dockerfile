# AidaHOS guest (Next.js captive portal) — build from monorepo root:
#   docker build -f infra/docker/guest.Dockerfile -t aidahos-guest .
FROM node:20-alpine AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable

FROM base AS build
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @aidahos/guest build

FROM base AS run
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app ./
EXPOSE 3001
CMD ["pnpm", "--filter", "@aidahos/guest", "start"]
