# Sonari API image for Timeweb Cloud App Platform (or any Docker host).
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
COPY db ./db
# The catalog (catalog/tracks.json) is read from GitHub: set GITHUB_REPO and GITHUB_BRANCH.
EXPOSE 8787
CMD ["node", "dist/index.js"]
