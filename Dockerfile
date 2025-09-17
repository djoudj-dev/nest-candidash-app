# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm prisma generate
RUN pnpm build

# Stage 2: Production
FROM node:20-alpine AS production

WORKDIR /app

RUN corepack enable

# Copier les fichiers de dépendances
COPY package.json pnpm-lock.yaml ./

# Installer les dépendances de production
RUN pnpm install --prod --frozen-lockfile

# Copier le schéma Prisma pour régénérer le client
COPY prisma ./prisma

# Régénérer Prisma client avec les dépendances de production
RUN npx prisma generate

# Copier les fichiers buildés
COPY --from=builder /app/dist ./dist

USER node

EXPOSE 3000

CMD ["node", "dist/main.js"]