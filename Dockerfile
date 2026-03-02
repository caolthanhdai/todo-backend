# Stage 1 - build
FROM node:18-alpine AS builder
# create app directory
WORKDIR /app
# copy package.json and package-lock.json
COPY package*.json ./
# install dependencies
RUN npm install
# copy source code
COPY . .

ARG DATABASE_URL
ENV DATABASE_URL=$DATABASE_URL

# generate prisma client
RUN npx prisma generate
# build the app
RUN npm run build

# Stage 2 - production
FROM node:18-alpine
WORKDIR /app
RUN apk add --no-cache curl
# copy package.json and package-lock.json
COPY package*.json ./
# install only production dependencies
RUN npm install --omit=dev
# copy built files from builder stage
COPY --from=builder /app/dist ./dist
# copy prisma files
COPY --from=builder /app/prisma ./prisma
RUN npx prisma generate
# expose port
EXPOSE 3001
# create uploads directory
RUN mkdir -p /app/uploads
# start the app
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/main.js"]
