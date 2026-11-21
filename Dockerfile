FROM node:24-bookworm-slim AS node

WORKDIR /usr/src/app
COPY package.json package-lock.json ./

FROM node AS base
RUN npm ci

FROM node AS app
RUN npm ci --omit=dev
COPY src ./src
COPY scripts/seed.ts ./scripts/seed.ts

USER node
CMD ["node", "src/index.ts"]
