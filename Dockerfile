# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app

# Activer corepack pour pnpm
RUN corepack enable

# Copier les dépendances
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Copier le code
COPY . .

# Générer Prisma client **à la build**
RUN pnpm prisma generate
RUN pnpm build

# Stage 2: Production
FROM node:20-alpine AS production
WORKDIR /app
RUN corepack enable

# Copier dépendances pour prod
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile

# Copier build + Prisma client déjà généré
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/generated ./generated
COPY prisma ./prisma

# Script de démarrage pour vérifier les variables d'environnement
COPY <<EOF /app/start.sh
#!/bin/sh
echo "=== Environment Variables Check ==="
echo "DATABASE_URL: \${DATABASE_URL:-NOT_SET}"
echo "NODE_ENV: \${NODE_ENV:-NOT_SET}"
echo "PORT: \${PORT:-NOT_SET}"
echo "=================================="

if [ -z "\$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL is not set!"
  echo "Please check Coolify environment variable configuration"
  exit 1
fi

exec node dist/main.js
EOF

RUN chmod +x /app/start.sh

# Créer un utilisateur non-root et donner les droits
RUN addgroup -g 1001 -S nodejs \
 && adduser -S nestjs -u 1001 \
 && chown -R nestjs:nodejs /app

USER nestjs
EXPOSE 3000

# Lancer avec le script de vérification
CMD ["/app/start.sh"]
