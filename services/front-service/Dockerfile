FROM node:20-alpine

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./
COPY tsconfig*.json ./
COPY vite.config.ts ./
COPY index.html ./

# Instalar dependencias
RUN npm install

# Copiar código fuente
COPY src ./src
COPY public ./public
COPY eslint.config.js ./

# Exponer puerto
EXPOSE 5173

# Comando para desarrollo (con hot reload)
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
