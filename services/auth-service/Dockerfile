FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY prisma.config.ts ./
COPY tsconfig.json ./

RUN npm install --legacy-peer-deps

COPY prisma ./prisma
COPY src ./src

# Generar Prisma Client
RUN DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" npm run prisma:generate

EXPOSE 3000

CMD ["npm", "run", "dev"]
