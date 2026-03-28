# Usa a versão Bookworm Slim do Node 20 por ser super estável 
# com pacotes C++ necessarios pelo 'better-sqlite3'
FROM node:20-bookworm-slim AS builder

WORKDIR /app

# Instala ferramentas essenciais para compilar o SQLite (caso precise)
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install

COPY . .

# Faz a build otimizada da aplicação Next.js
RUN npm run build

# Limpa o diretorio para manter só producao
RUN npm install --omit=dev

# Cria pasta public (vazia) se ela não existir no projeto, evitando erro no runner
RUN mkdir -p public

# -----------------
# Imagem Final (Enxuta)
# -----------------
FROM node:20-bookworm-slim AS runner

WORKDIR /app

# Variáveis do sistema do container
ENV NODE_ENV=production
ENV PORT=3000

# Usado pela API para forçar a URL em redirecionamentos, se a variavel externa falhar.
ENV HOSTNAME="0.0.0.0"

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
# Copia a pasta de src caso haja referências (O Next carrega pela .next, mas por segurança mantemos configs na raiz)
COPY --from=builder /app/next.config.js ./next.config.js* 
COPY --from=builder /app/jsconfig.json ./jsconfig.json*

# Garante a existência do diretório do Banco de Dados SQLite com as devidas permissões
RUN mkdir -p /app/.data && chown -R node:node /app/.data

# Baixa privilégios (Boa prática de segurança da Docker)
USER node

EXPOSE 3000

CMD ["npm", "start"]
