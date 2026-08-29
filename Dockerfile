FROM node:24-alpine AS dependencies

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

FROM dependencies AS build

COPY prisma ./prisma
COPY tsconfig.json ./
COPY server.ts ./
COPY src ./src
RUN npm run build

FROM build AS production-dependencies
RUN npm prune --omit=dev

FROM node:24-alpine AS runtime

ENV NODE_ENV=production
WORKDIR /app

COPY --from=production-dependencies --chown=node:node /app/package.json /app/package-lock.json ./
COPY --from=production-dependencies --chown=node:node /app/node_modules ./node_modules
COPY --from=production-dependencies --chown=node:node /app/prisma ./prisma
COPY --from=production-dependencies --chown=node:node /app/dist ./dist

EXPOSE 3333
USER node

CMD ["npm", "start"]

FROM dependencies AS migration

ENV NODE_ENV=production
WORKDIR /app

COPY prisma ./prisma

USER node

CMD ["./node_modules/.bin/prisma", "migrate", "deploy"]
