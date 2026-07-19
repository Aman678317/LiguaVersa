# Multi-stage production build for Vite React Frontend
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependencies
COPY package*.json ./
RUN npm ci

# Copy code and build
COPY . .
RUN npm run build

# Serve with Nginx
FROM nginx:alpine AS production

# Copy built static assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Replace default config with SPA config
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
