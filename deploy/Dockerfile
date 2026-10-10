FROM node:24-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_API_BASE_URL=/api
ARG VITE_PLATFORM_HOSTS=platform.example.com
ARG VITE_PLATFORM_NAME="Day Recharge"
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL VITE_PLATFORM_HOSTS=$VITE_PLATFORM_HOSTS VITE_PLATFORM_NAME=$VITE_PLATFORM_NAME
RUN npm run build
FROM nginx:alpine
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
