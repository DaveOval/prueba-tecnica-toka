# Prueba Técnica - Sistema de Microservicios con IA

Sistema completo de microservicios implementado con arquitectura DDD y Clean Architecture, incluyendo integración de IA con RAG (Retrieval-Augmented Generation).

## Descripción del Proyecto

Este proyecto implementa un sistema distribuido compuesto por 5 microservicios backend y un frontend, diseñado para demostrar competencias en:

- Arquitectura de microservicios
- Domain-Driven Design (DDD)
- Clean Architecture
- Integración de IA con RAG
- Comunicación asíncrona y síncrona
- Estrategia multi-base de datos
- Testing y cobertura de código

## Arquitectura

### Microservicios Backend

1. **auth-service** (Node.js/TypeScript)
   - Autenticación y autorización
   - Gestión de usuarios y roles
   - JWT tokens
   - Base de datos: PostgreSQL

2. **user-service** (Node.js/TypeScript)
   - Gestión de perfiles de usuario
   - Caché con Redis
   - Base de datos: PostgreSQL

3. **audit-service** (Node.js/TypeScript)
   - Registro de eventos de auditoría
   - Base de datos: MongoDB

4. **vectorization-service** (Python/FastAPI)
   - Procesamiento de documentos PDF
   - Generación de embeddings
   - Almacenamiento vectorial: ChromaDB

5. **ai-chat-service** (Python/FastAPI)
   - Chat con IA usando RAG
   - Gestión de prompts
   - Integración con OpenAI

### Frontend

- **front-service** (React/TypeScript)
  - Interfaz de usuario completa
  - Redux Toolkit para state management
  - Integración con todos los microservicios

## Tecnologías Utilizadas

### Backend
- **Node.js/TypeScript**: Express, Prisma, Jest
- **Python**: FastAPI, structlog, pytest
- **Bases de Datos**: PostgreSQL, MongoDB, Redis, ChromaDB
- **Mensajería**: Kafka
- **IA**: OpenAI API (GPT-4, embeddings)

### Frontend
- **React 18** con TypeScript
- **Redux Toolkit** para state management
- **Vite** como build tool
- **React Testing Library** para testing

### Infraestructura
- **Docker** y **Docker Compose**
- **Logging estructurado JSON** (Winston, structlog)

## Características Principales

- Arquitectura de microservicios con 5 servicios backend
- Comunicación síncrona (REST) y asíncrona (Kafka)
- Estrategia multi-base de datos (PostgreSQL, MongoDB, Redis, ChromaDB)
- Autenticación distribuida con JWT
- Integración de IA con RAG para búsqueda semántica
- Logging estructurado JSON en todos los servicios
- Tests unitarios con cobertura >70% en todos los servicios
- Documentación arquitectónica completa
- Dockerización completa del proyecto

## Estructura del Proyecto

```
prueba-tecnica-toka/
├── services/
│   ├── auth-service/          # Servicio de autenticación
│   ├── user-service/          # Servicio de usuarios
│   ├── audit-service/         # Servicio de auditoría
│   ├── vectorization-service/ # Servicio de vectorización
│   ├── ai-chat-service/       # Servicio de chat con IA
│   └── front-service/         # Frontend React
├── docs/                      # Documentación del proyecto
│   ├── ARCHITECTURE.md        # Documentación arquitectónica
│   ├── PROMPT_ENGINEERING.md  # Documentación de prompts
│   └── EJERCICIO_4_DIAGNOSTICO.md # Ejercicio de diagnóstico
├── docker-compose.yml         # Configuración de Docker Compose
├── EJECUCION.md              # Guía de ejecución paso a paso
├── ANALISIS_PROGRESO.md      # Análisis de progreso del proyecto
└── README.md                 # Este archivo
```

## Inicio Rápido

Para ejecutar el proyecto completo, sigue la guía detallada en [EJECUCION.md](./EJECUCION.md).

**Resumen rápido:**

1. Configurar variables de entorno (copiar `.env.template` a `.env`)
2. Levantar servicios: `docker-compose up -d`
3. Ejecutar migraciones de base de datos
4. Reiniciar auth-service para crear usuario admin
5. Acceder a `http://localhost:5173`

## Credenciales por Defecto

- **Email:** `admin@example.com`
- **Password:** `admin123`

Estas credenciales se pueden modificar en el archivo `.env`.

## Documentación

- **[EJECUCION.md](./EJECUCION.md)**: Guía completa de ejecución paso a paso
- **[docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)**: Documentación arquitectónica detallada
- **[docs/PROMPT_ENGINEERING.md](./docs/PROMPT_ENGINEERING.md)**: Estrategia de prompt engineering
- **[docs/EJERCICIO_4_DIAGNOSTICO.md](./docs/EJERCICIO_4_DIAGNOSTICO.md)**: Ejercicio de diagnóstico
- **[ANALISIS_PROGRESO.md](./ANALISIS_PROGRESO.md)**: Análisis de progreso del proyecto
- **[ENDPOINTS_TESTING.md](./ENDPOINTS_TESTING.md)**: Documentación de endpoints de la API
- **[LOGGING_IMPLEMENTATION.md](./LOGGING_IMPLEMENTATION.md)**: Documentación del logging estructurado

## Testing

Todos los servicios incluyen tests unitarios con cobertura mínima del 70%:

```bash
# Ejecutar tests de un servicio específico
cd services/auth-service
npm test

# Con cobertura
npm run test:coverage
```

## Requisitos

- Docker y Docker Compose
- Al menos 8GB de RAM
- API Key de OpenAI (para funcionalidades de IA)
- Puertos libres: 3000-3004, 5173, 5432, 6379, 8000, 9092, 27017

## Estado del Proyecto

El proyecto está **completado al 100%** según los requisitos de la prueba técnica:

- Ejercicio 1: Diseño y Arquitectura
- Ejercicio 2: Implementación de Microservicios
- Ejercicio 3: Desarrollo Front-end
- Ejercicio 4: Diagnóstico
- Ejercicio 5: Integración de IA y Agentes

## Licencia

Este proyecto fue desarrollado como parte de una prueba técnica.
