# ---- Build stage ----
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev

COPY . .

# ---- Production stage ----
FROM node:20-alpine

WORKDIR /app

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=build /app /app

RUN mkdir -p /app/logs /app/uploads && chown -R appuser:appgroup /app

USER appuser

EXPOSE 5000

CMD ["node", "server.js"]