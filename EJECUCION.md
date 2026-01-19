# Guía de Ejecución del Proyecto

Esta guía detalla los pasos necesarios para ejecutar el proyecto completo.

## Requisitos Previos

- Docker y Docker Compose instalados
- Git instalado
- Al menos 8GB de RAM disponible
- Puertos libres: 3000-3004, 5173, 5432, 6379, 8000, 9092, 27017

## Paso 1: Configurar Variables de Entorno

1. Copiar el archivo de plantilla de variables de entorno:

```bash
cp .env.template .env
```

2. Editar el archivo `.env` y configurar las siguientes variables:

### Variables Requeridas (Mínimas)

```env
# OpenAI API Key (REQUERIDO para servicios de IA)
OPENAI_API_KEY=tu-api-key-aqui
```

### Variables Opcionales (con valores por defecto)

```env
# Credenciales de PostgreSQL
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=auth_db

# Credenciales de MongoDB
MONGO_USER=admin
MONGO_PASSWORD=admin
MONGO_DB=audit_db

# Credenciales del usuario administrador
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=admin123

# JWT Secrets (cambiar en producción)
JWT_ACCESS_SECRET=your-super-secret-access-key-change-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Redis
REDIS_PORT=6379

# Configuración de IA
EMBEDDING_MODEL=text-embedding-3-small
LLM_MODEL=gpt-4o-mini
DEFAULT_SYSTEM_PROMPT=Eres un asistente útil. Responde preguntas basándote en el contexto proporcionado.

# Entorno
NODE_ENV=development
LOG_LEVEL=info

# Frontend URLs (si se necesita cambiar)
FRONTEND_URL=http://localhost:5173
VITE_API_AUTH_URL=/api/auth
VITE_API_USER_URL=/api/users
VITE_API_AUDIT_URL=/api/audit
VITE_API_AI_CHAT_URL=/api/ai
VITE_API_VECTORIZATION_URL=/api/ai
VITE_API_URL=/api/auth

# Vectorization Service
MAX_FILE_SIZE_MB=50
```

**Nota:** Todas las variables tienen valores por defecto, excepto `OPENAI_API_KEY` que es requerida para que funcionen los servicios de IA (vectorization-service y ai-chat-service). Si no configuras las demás, el sistema funcionará con los valores por defecto.

## Paso 2: Levantar los Servicios con Docker Compose

Ejecutar el siguiente comando para levantar todos los servicios:

```bash
docker-compose up -d
```

Este comando iniciará:
- PostgreSQL (puerto 5432)
- MongoDB (puerto 27017)
- Redis (puerto 6379)
- Kafka + Zookeeper (puerto 9092)
- ChromaDB (puerto 8000)
- Todos los microservicios (puertos 3000-3004)
- Frontend (puerto 5173)

**Nota:** La primera vez puede tardar varios minutos mientras se descargan las imágenes y se construyen los contenedores.

## Paso 3: Verificar que los Servicios Estén Activos

Esperar aproximadamente 1-2 minutos y verificar el estado de los servicios:

```bash
docker-compose ps
```

Todos los servicios deben mostrar estado "healthy" o "running".

## Paso 4: Ejecutar Migraciones de Base de Datos

### 4.1 Migraciones de Auth Service

Ejecutar las migraciones de Prisma para el servicio de autenticación:

```bash
docker-compose exec auth-service npm run prisma:migrate
```

Este comando creará las tablas necesarias en la base de datos `auth_db`.

### 4.2 Migraciones de User Service

Ejecutar las migraciones de Prisma para el servicio de usuarios:

```bash
docker-compose exec user-service npm run prisma:migrate
```

Este comando creará las tablas necesarias en la base de datos `user_db`.

**Nota:** MongoDB y ChromaDB no requieren migraciones manuales, se inicializan automáticamente.

## Paso 5: Reiniciar el Servicio de Autenticación

Reiniciar el servicio de autenticación para que se cree el usuario administrador:

```bash
docker-compose restart auth-service
```

Esperar aproximadamente 30 segundos para que el servicio se reinicie completamente.

## Paso 6: Verificar que Todo Esté Funcionando

### 6.1 Verificar Health Checks

Verificar que todos los servicios respondan correctamente:

```bash
# Auth Service
curl http://localhost:3000/health

# User Service
curl http://localhost:3001/health

# Audit Service
curl http://localhost:3002/health

# Vectorization Service
curl http://localhost:3003/health

# AI Chat Service
curl http://localhost:3004/health
```

Todos deben responder con `{"status":"ok"}` o `{"message":"OK"}`.

### 6.2 Verificar Frontend

Abrir el navegador y acceder a:

```
http://localhost:5173
```

El frontend debería cargar correctamente.

### 6.3 Verificar Usuario Administrador

El usuario administrador se crea automáticamente con las credenciales configuradas en `.env`:
- **Email:** `admin@example.com` (o el valor de `ADMIN_EMAIL`)
- **Password:** `admin123` (o el valor de `ADMIN_PASSWORD`)

## Paso 7: Acceder a la Aplicación

1. Abrir el navegador en `http://localhost:5173`
2. Iniciar sesión con las credenciales del administrador
3. Explorar las funcionalidades disponibles

## Paso 8: Subir un Documento PDF para Vectorizar

Para probar la funcionalidad de RAG (Retrieval-Augmented Generation), es necesario subir al menos un documento PDF que será vectorizado y usado como contexto para las respuestas del chat con IA.

### 8.1 Usar Documento de Ejemplo

El proyecto incluye un documento de ejemplo en el directorio `examples/`:

- **aviones_rag.pdf**: Documento de ejemplo sobre aviones

### 8.2 Subir Documento desde el Frontend

1. En la aplicación web (`http://localhost:5173`), navegar a la sección de **"Documentos"** o **"AI Documents"**
2. Hacer clic en el botón de **"Subir Documento"** o **"Upload Document"**
3. Seleccionar el archivo PDF (puedes usar `examples/aviones_rag.pdf` o cualquier otro PDF)
4. Opcionalmente, agregar un nombre y descripción al documento
5. Hacer clic en **"Subir"** o **"Upload"**
6. Esperar a que el documento sea procesado (esto puede tardar varios segundos)

### 8.3 Verificar que el Documento Fue Procesado

Una vez procesado, el documento debería aparecer en la lista de documentos disponibles. El sistema habrá:
- Extraído el texto del PDF
- Generado embeddings para cada chunk del documento
- Almacenado los vectores en ChromaDB

### 8.4 Probar RAG con el Documento

1. Navegar a la sección de **"Chat con IA"** o **"AI Chat"**
2. Hacer una pregunta relacionada con el contenido del documento subido
3. El sistema debería responder usando el contexto del documento vectorizado

**Ejemplo de preguntas (si usaste aviones_rag.pdf):**
- "¿Qué tipos de aviones se mencionan en el documento?"
- "Explica las características principales de los aviones"
- "¿Cuál es la información más relevante sobre aviones?"

**Nota:** Si no subes ningún documento, el chat con IA funcionará pero sin contexto de documentos.

### 8.5 Subir Documento usando API (Alternativa)

También puedes subir documentos directamente usando la API:

```bash
curl -X POST http://localhost:3003/api/ai/documents/upload \
  -H "Authorization: Bearer TU_TOKEN_JWT" \
  -F "file=@examples/aviones_rag.pdf" \
  -F "name=Aviones RAG" \
  -F "description=Documento de ejemplo sobre aviones"
```

**Nota:** Necesitarás un token JWT válido. Puedes obtenerlo iniciando sesión en el frontend o usando el endpoint de login.

## Comandos Útiles

### Ver Logs de Todos los Servicios

```bash
docker-compose logs -f
```

### Ver Logs de un Servicio Específico

```bash
# Auth Service
docker-compose logs -f auth-service

# User Service
docker-compose logs -f user-service

# AI Chat Service
docker-compose logs -f ai-chat-service
```

### Detener Todos los Servicios

```bash
docker-compose down
```

### Detener y Eliminar Volúmenes (limpieza completa)

```bash
docker-compose down -v
```

**Advertencia:** Esto eliminará todos los datos almacenados en las bases de datos.

### Reconstruir un Servicio Específico

```bash
docker-compose build auth-service
docker-compose up -d auth-service
```

### Ejecutar Comandos Dentro de un Contenedor

```bash
# Acceder al shell del auth-service
docker-compose exec auth-service sh

# Ejecutar Prisma Studio (interfaz visual de base de datos)
docker-compose exec auth-service npm run prisma:studio
```

## Solución de Problemas

### Los servicios no inician

1. Verificar que los puertos no estén en uso:
   ```bash
   # Windows
   netstat -ano | findstr :3000
   
   # Linux/Mac
   lsof -i :3000
   ```

2. Verificar los logs de errores:
   ```bash
   docker-compose logs [nombre-servicio]
   ```

3. Verificar que Docker tenga suficientes recursos asignados (mínimo 8GB RAM)

### Error de conexión a base de datos

1. Verificar que PostgreSQL esté corriendo:
   ```bash
   docker-compose ps postgres
   ```

2. Verificar las variables de entorno en `.env`

3. Esperar unos segundos más, las bases de datos pueden tardar en inicializarse

### Error al crear usuario administrador

1. Verificar que las migraciones se ejecutaron correctamente:
   ```bash
   docker-compose exec auth-service npm run prisma:migrate
   ```

2. Reiniciar el servicio de autenticación:
   ```bash
   docker-compose restart auth-service
   ```

3. Verificar los logs:
   ```bash
   docker-compose logs auth-service
   ```

### Error de OpenAI API Key

Si los servicios de IA no funcionan:

1. Verificar que `OPENAI_API_KEY` esté configurada en `.env`
2. Verificar que la API key sea válida
3. Reiniciar los servicios de IA:
   ```bash
   docker-compose restart vectorization-service ai-chat-service
   ```

## Estructura de Puertos

| Servicio | Puerto | URL |
|----------|--------|-----|
| Frontend | 5173 | http://localhost:5173 |
| Auth Service | 3000 | http://localhost:3000 |
| User Service | 3001 | http://localhost:3001 |
| Audit Service | 3002 | http://localhost:3002 |
| Vectorization Service | 3003 | http://localhost:3003 |
| AI Chat Service | 3004 | http://localhost:3004 |
| PostgreSQL | 5432 | localhost:5432 |
| MongoDB | 27017 | localhost:27017 |
| Redis | 6379 | localhost:6379 |
| ChromaDB | 8000 | http://localhost:8000 |
| Kafka | 9092 | localhost:9092 |

## Próximos Pasos

Una vez que todo esté funcionando:

1. Explorar la documentación de la API en `ENDPOINTS_TESTING.md`
2. Revisar la documentación arquitectónica en `docs/ARCHITECTURE.md`
3. Consultar la documentación de prompt engineering en `docs/PROMPT_ENGINEERING.md`
4. Revisar el análisis de progreso en `ANALISIS_PROGRESO.md`
