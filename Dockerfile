FROM node:22-alpine AS build
WORKDIR /app/web
COPY web/package.json web/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY web/ ./
RUN npm run build

FROM nginx:stable-alpine AS runtime
ENV PORT=8080
ENV NGINX_ENVSUBST_FILTER=^PORT$
COPY deploy/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/web/dist/ /usr/share/nginx/html/
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
