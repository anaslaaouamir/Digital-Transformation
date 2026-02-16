FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm ci --prefer-offline --no-audit --progress=false

# Copy source
COPY . .

# Build
RUN npm run build

FROM nginx:stable-alpine AS runner

COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
