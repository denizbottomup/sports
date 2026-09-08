FROM node:22-alpine AS build
WORKDIR /app/web
COPY web/package.json web/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY web/ ./
RUN npm run build

FROM node:22-alpine AS runtime
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund
COPY server/ ./server/
COPY --from=build /app/web/dist/ ./web/dist/
ENV PORT=8080
ENV NODE_ENV=production
ENV DATA_DIR=/app/data
RUN mkdir -p /app/data
EXPOSE 8080
CMD ["node", "server/index.js"]
