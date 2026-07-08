# --- Base stage: deps + source (used by the one-shot migrate service) ---
FROM node:24-alpine AS base
WORKDIR /app

# Pin pnpm to the version used locally. Newer pnpm turns "ignored build
# scripts" (esbuild) into a fatal error; 10.34.x honors onlyBuiltDependencies
# from pnpm-workspace.yaml and builds esbuild without prompting.
RUN npm install -g pnpm@10.34.2

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

# --- Build stage ---
FROM base AS build

# VITE_* vars are inlined into the client bundle at build time
ARG VITE_BASE_URL
ENV VITE_BASE_URL=$VITE_BASE_URL

RUN pnpm build

# --- Runtime stage ---
FROM node:24-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY --from=build /app/.output ./.output

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
