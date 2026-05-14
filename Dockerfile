FROM node:22-alpine

WORKDIR /app

# Build client
COPY client/package*.json ./client/
RUN cd client && npm ci
COPY client/ ./client/
RUN cd client && npm run build

# Install server
COPY server/package*.json ./server/
RUN cd server && npm ci
COPY server/ ./server/
RUN cd server && npx prisma generate

EXPOSE 3001
ENV NODE_ENV=production
ENV PORT=3001

CMD ["sh", "-c", "cd server && npx prisma migrate deploy && npx tsx src/index.ts"]
