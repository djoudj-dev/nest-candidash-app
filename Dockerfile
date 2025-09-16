# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Activer corepack pour pnpm
RUN corepack enable

# Copier les fichiers de dépendances
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Copier tout le code source
COPY . .

# Générer Prisma client et build l'application
RUN pnpm prisma generate
RUN pnpm build

# Stage 2: Production
FROM node:20-alpine AS production

WORKDIR /app

# Activer corepack pour pnpm
RUN corepack enable

# Copier les fichiers de dépendances
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile

# Copier Prisma et les fichiers buildés
COPY prisma ./prisma
COPY --from=builder /app/dist ./dist

# Créer un utilisateur non-root et donner les droits sur /app
RUN addgroup -g 1001 -S nodejs \
 && adduser -S nestjs -u 1001 \
 && chown -R nestjs:nodejs /app

# Passer à l'utilisateur non-root
USER nestjs

EXPOSE 3000

# Générer Prisma client au runtime puis lancer l'app
CMD ["sh", "-c", "npx prisma generate && node dist/main.js"]
