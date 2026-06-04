# AidaHOS web (Next.js admin) — build from monorepo root:
#   docker build -f infra/docker/web.Dockerfile -t aidahos-web .
FROM node:20-alpine AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable

FROM base AS build
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @aidahos/web build

FROM base AS run
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app ./
EXPOSE 3000
CMD ["pnpm", "--filter", "@aidahos/web", "start"]
