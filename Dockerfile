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

# Installer les dépendances de production
RUN pnpm install --prod --frozen-lockfile

# Copier le schéma Prisma pour régénérer le client
COPY prisma ./prisma

# Régénérer Prisma client avec les dépendances de production
RUN npx prisma generate

# Copier les fichiers buildés
COPY --from=builder /app/dist ./dist

# Créer un utilisateur non-root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001

# Créer les répertoires d'uploads et définir les permissions
RUN mkdir -p /app/uploads && \
    chown -R nestjs:nodejs /app && \
    chmod -R 755 /app

USER nestjs

EXPOSE 3000

CMD ["node", "dist/main.js"]