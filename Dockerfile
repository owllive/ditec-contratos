FROM node:20-alpine AS base
WORKDIR /app
COPY package.json package-lock.json* tsconfig.json prisma ./
COPY src ./src
RUN npm install --omit=dev && npx prisma generate
RUN npm install --only=dev && npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/dist ./dist
COPY --from=base /app/prisma ./prisma
ENV NODE_ENV=production
CMD ["node", "dist/server.js"]
