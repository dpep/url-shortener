FROM node:24-bookworm-slim AS base

WORKDIR /usr/src/app
COPY package.json package-lock.json ./

FROM base AS tools
RUN npm ci

FROM base AS app
RUN npm ci --omit=dev
COPY src ./src
COPY scripts/seed.ts ./scripts/seed.ts

USER node
CMD ["node", "src/index.ts"]
