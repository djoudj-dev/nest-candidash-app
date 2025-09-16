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

# Créer un utilisateur non-root et donner les droits
RUN addgroup -g 1001 -S nodejs \
 && adduser -S nestjs -u 1001 \
 && chown -R nestjs:nodejs /app

USER nestjs
EXPOSE 3000

# Lancer directement l'app sans regénérer Prisma
CMD ["node", "dist/main.js"]
