FROM node:24-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY ui ./ui
COPY preview ./preview
COPY scripts ./scripts
COPY assets ./assets
ENV PORT=8080 WALLPAPER_DIR=/tmp/wallpapers NODE_ENV=production
USER 1000:1000
EXPOSE 8080
CMD ["node", "preview/server.mjs"]
