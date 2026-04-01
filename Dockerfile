# ============================================
#  RS Connect - Dockerfile de Produção
#  GitHub → Hostinger Docker Manager → Auto-Deploy
# ============================================

# --- STAGE 1: Builder ---
FROM node:20-bookworm-slim AS builder

WORKDIR /app

# Dependências de compilação C++ (necessário para better-sqlite3)
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci

COPY . .

# Build otimizado da aplicação Next.js
RUN npm run build

# --- STAGE 2: Runner (Imagem Final Enxuta) ---
FROM node:20-bookworm-slim AS runner

WORKDIR /app

# Recompila apenas dependências nativas na imagem final para evitar
# incompatibilidade de binários entre stages
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

# Variáveis fixas do container (as demais vêm pelo painel da Hostinger)
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Copia apenas o necessário do builder
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/next.config.js ./next.config.js
COPY --from=builder /app/jsconfig.json ./jsconfig.json
COPY --from=builder /app/node_modules ./node_modules

# Pasta public (mesmo vazia, Next.js espera ela)
RUN mkdir -p public

# Diretório do Banco de Dados SQLite (persistido via Volume)
RUN mkdir -p /app/.data && chown -R node:node /app/.data

# Segurança: roda como usuário não-root
USER node

EXPOSE 3000

# Comando de inicialização (next start)
CMD ["npm", "start"]
