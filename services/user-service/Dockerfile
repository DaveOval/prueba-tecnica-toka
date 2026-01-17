FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY prisma.config.ts ./
COPY tsconfig.json ./

RUN npm ci

COPY prisma ./prisma
COPY src ./src

EXPOSE 3001

COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["npm", "run", "dev"]


