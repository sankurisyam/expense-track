FROM node:20-bookworm-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --omit=dev --prefer-offline --no-audit --no-fund
COPY server.js db.json ./

EXPOSE 3001

CMD ["npm", "start"]
