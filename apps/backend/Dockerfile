# Build from the repo root: docker build -f apps/backend/Dockerfile .
# (needs the root pnpm-workspace.yaml/lockfile, since this is a pnpm monorepo)

FROM node:20-slim AS builder
RUN npm install -g pnpm@9
WORKDIR /workspace

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/backend/package.json apps/backend/package.json
COPY apps/frontend/package.json apps/frontend/package.json
RUN pnpm install --frozen-lockfile

COPY apps/backend apps/backend
RUN pnpm --filter backend build
RUN pnpm --filter backend deploy --prod /out

FROM node:20-slim
ENV NODE_ENV=production
ENV PORT=3000
WORKDIR /app
COPY --from=builder /out .
EXPOSE 3000
CMD ["node", "dist/index.js"]
