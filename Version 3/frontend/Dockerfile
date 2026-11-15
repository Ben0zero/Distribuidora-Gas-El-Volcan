# syntax=docker/dockerfile:1
# ============================================================
#  Frontend El Volcán — imagen multi-etapa
#  1) build: Node 22 compila la SPA (npm ci + vite build)
#  2) final: Nginx sirve dist/ y reenvía /api/v1 y /api/v2 a cada
#     microservicio por la red interna de Docker (nginx/default.conf)
#  No se define VITE_API_BASE: el frontend usa rutas relativas (/api/...).
# ============================================================

FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --no-audit --no-fund
COPY . .
RUN npm run build

FROM nginx:1.27-alpine
COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
