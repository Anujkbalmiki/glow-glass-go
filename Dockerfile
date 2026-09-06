FROM node:22-alpine AS build

WORKDIR /app
ENV NITRO_PRESET=node-server
COPY package.json bun.lock ./
RUN npm install --ignore-scripts
COPY . .
RUN npm run build

FROM node:22-alpine AS runtime

WORKDIR /app
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000
COPY --from=build /app/.output ./.output

EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
