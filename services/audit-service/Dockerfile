FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY tsconfig.json ./

RUN npm install --legacy-peer-deps

COPY src ./src

EXPOSE 3002

CMD ["npm", "run", "dev"]
