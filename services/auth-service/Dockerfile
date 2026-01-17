FROM node:20-alpine

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./
COPY prisma.config.ts ./
COPY tsconfig.json ./

# Instalar dependencias
RUN npm ci

# Copiar código fuente
COPY prisma ./prisma
COPY src ./src

# Compilar TypeScript (opcional, si quieres compilar antes)
# RUN npm run build

EXPOSE 3000

# Script de inicio que genera Prisma Client y luego ejecuta el comando
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["npm", "run", "dev"]

# Para producción, usar:
# CMD ["npm", "start"]
