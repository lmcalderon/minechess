# Build from the repo root: docker build -f apps/frontend/Dockerfile .
# (needs the root pnpm-workspace.yaml/lockfile, since this is a pnpm monorepo)

FROM node:20-slim AS builder
RUN npm install -g pnpm@9
WORKDIR /workspace

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/backend/package.json apps/backend/package.json
COPY apps/frontend/package.json apps/frontend/package.json
RUN pnpm install --frozen-lockfile

COPY apps/frontend apps/frontend

# Matches the app's own fallback in src/api.ts; override at build time if needed.
ARG VITE_API_BASE_URL=http://localhost:3000
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN pnpm --filter frontend build

FROM nginx:alpine
COPY apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /workspace/apps/frontend/dist /usr/share/nginx/html
EXPOSE 80
