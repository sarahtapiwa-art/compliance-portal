## Install dependencies only when needed
#FROM node:20-alpine AS deps
#WORKDIR /app
#
## Install dependencies
#COPY package.json package-lock.json ./
#RUN npm ci
#
## Rebuild the source code only when needed
#FROM node:20-alpine AS builder
#WORKDIR /app
#
#COPY . .
#COPY --from=deps /app/node_modules ./node_modules
#
## Build Next.js app
#RUN npm run build
#
## Production image, copy all the files and run next
#FROM node:20-alpine AS runner
#WORKDIR /app
#ENV NODE_ENV=production
#
## Copy built files and node_modules
#COPY --from=builder /app/public ./public
#COPY --from=builder /app/.next ./.next
#COPY --from=builder /app/node_modules ./node_modules
#COPY --from=builder /app/package.json ./package.json
#
#EXPOSE 3000
#CMD ["npm", "start"]
# Stage 1: Install dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Stage 2: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY . .
COPY --from=deps /app/node_modules ./node_modules
RUN npm run build

# Stage 3: Production runner
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000
CMD ["npm", "start"]
