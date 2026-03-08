FROM node:22-alpine

WORKDIR /app

# Install server dependencies
COPY package.json package-lock.json* ./
RUN npm install --production=false

# Install client dependencies and build
COPY client/package.json client/package-lock.json* ./client/
RUN cd client && npm install

COPY . .
RUN cd client && npx vite build

# Remove dev dependencies
RUN npm prune --production

ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0
ENV DATA_DIR=/app/data

EXPOSE 3000

CMD ["node", "server/index.js"]
