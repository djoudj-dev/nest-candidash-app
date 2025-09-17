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

# Vérification de santé pour Coolify
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "const http = require('http'); http.get('http://localhost:3000/api/v1', (res) => { process.exit(res.statusCode === 404 ? 0 : 1); }).on('error', () => process.exit(1));"

# Commande de démarrage avec gestion d'erreur
CMD ["sh", "-c", "echo 'Starting application...' && echo 'DATABASE_URL: ${DATABASE_URL:-NOT_SET}' && node dist/main"]