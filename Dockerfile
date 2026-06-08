# Stage 1: Build static assets
FROM node:22-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci

COPY . .

# Run build script to generate static 'dist' directory
RUN npm run build

# Stage 2: Run web server
FROM nginx:1.25-alpine

# Copy built artifacts to Nginx html directory
COPY --from=builder /usr/src/app/dist /usr/share/nginx/html

# Copy custom Nginx routing and proxy configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
