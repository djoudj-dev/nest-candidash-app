# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Activer corepack pour pnpm
RUN corepack enable

# Copier les fichiers de dépendances
COPY package.json pnpm-lock.yaml ./

# Installer toutes les dépendances (dev + prod) pour le build
RUN pnpm install --frozen-lockfile

# Copier le code source
COPY . .

# Générer le client Prisma
RUN pnpm prisma generate

# Build de l'application
RUN pnpm build

# Stage 2: Production
FROM node:20-alpine AS production

WORKDIR /app

# Activer corepack pour pnpm
RUN corepack enable

# Copier les fichiers de dépendances
COPY package.json pnpm-lock.yaml ./

# Installer uniquement les dépendances de production
RUN pnpm install --prod --frozen-lockfile

# Copier les artefacts de build depuis le stage builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/generated ./generated

# Copier le schéma Prisma (nécessaire pour les migrations si besoin)
COPY prisma ./prisma

# Créer un utilisateur non-root pour la sécurité
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001 && \
    chown -R nestjs:nodejs /app

# Basculer vers l'utilisateur non-root
USER nestjs

# Exposer le port de l'application
EXPOSE 3000

# Variables d'environnement par défaut
ENV NODE_ENV=production
ENV PORT=3000

# Commande de démarrage
CMD ["node", "dist/main"]