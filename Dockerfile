# syntax=docker/dockerfile:1
# Builds ONE Next.js app from the pnpm/turbo monorepo into a slim standalone runner.
# Pick the app at build time:  --build-arg APP=web   |   --build-arg APP=guest
# Both apps listen on PORT 3000 (separate containers); Coolify maps the domain → :3000.
ARG APP=web

# ---- base: node + pnpm ----
FROM node:20-slim AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

# ---- build: install workspace, build the target app (+ its deps via turbo) ----
FROM base AS build
COPY . .
RUN pnpm install --frozen-lockfile
ARG APP
# The only build-time public var (guest root redirect). Everything else is runtime env.
ARG NEXT_PUBLIC_GUEST_DEFAULT_HOTEL=esken-bodrum
ENV NEXT_PUBLIC_GUEST_DEFAULT_HOTEL=${NEXT_PUBLIC_GUEST_DEFAULT_HOTEL}
RUN pnpm turbo run build --filter="@aidahos/${APP}"

# ---- runner: only the standalone bundle + static assets ----
FROM node:20-slim AS runner
ARG APP
ENV APP=${APP} NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0
WORKDIR /app
# Next standalone output (tracing root = repo root → nested under apps/<app>/)
COPY --from=build /app/apps/${APP}/.next/standalone ./
COPY --from=build /app/apps/${APP}/.next/static ./apps/${APP}/.next/static
EXPOSE 3000
CMD node "apps/${APP}/server.js"
