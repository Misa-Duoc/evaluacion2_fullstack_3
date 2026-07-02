# --- Etapa 1: build ---
# Compila la app React/Vite a archivos estaticos (dist/).
FROM node:20-alpine AS build

WORKDIR /app

# Se copian primero los manifiestos para aprovechar la cache de capas de Docker:
# si package*.json no cambia, no se reinstalan dependencias en cada build.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# --- Etapa 2: runtime ---
# Sirve los archivos estaticos generados con Nginx. La imagen final no
# contiene Node ni node_modules, solo el resultado de "npm run build".
FROM nginx:1.27-alpine AS runtime

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=15s --timeout=5s --retries=10 --start-period=10s \
    CMD wget -qO- http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
