FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:22-alpine AS prod
WORKDIR /app
COPY --from=build /app/.output /app/.output
# Datasets are written here; mount a persistent volume at /app/.data in Dokploy so history survives redeploys.
ENV DATA_DIR=/app/.data/datasets
EXPOSE 3000
CMD ["node", "/app/.output/server/index.mjs"]
