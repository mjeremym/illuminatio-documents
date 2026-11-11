FROM node:24-alpine AS build

WORKDIR /site

COPY site/package.json site/package-lock.json ./
RUN npm ci --ignore-scripts

COPY site/ ./
COPY images/ /images/

RUN npm run build:site

FROM nginxinc/nginx-unprivileged:1.29-alpine

LABEL org.opencontainers.image.title="Illuminatio Documentation" \
      org.opencontainers.image.description="Protected Illuminatio Docusaurus documentation site" \
      org.opencontainers.image.source="https://github.com/mjeremym/illuminatio-documents"

COPY deployment/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /site/build/ /usr/share/nginx/html/

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/healthz >/dev/null || exit 1
