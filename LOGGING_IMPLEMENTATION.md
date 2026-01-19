# Implementación de Logging Estructurado JSON

## Resumen

Se ha implementado logging estructurado JSON en todos los microservicios backend, cumpliendo con el requisito del Ejercicio 2 de la prueba técnica.

## Servicios Node.js (TypeScript)

### Dependencias agregadas

- **winston**: `^3.15.0` - Librería de logging estructurado para Node.js

### Configuración

Cada servicio Node.js tiene un módulo de logger en:
- `services/auth-service/src/infrastructure/config/logger.ts`
- `services/user-service/src/infrastructure/config/logger.ts`
- `services/audit-service/src/infrastructure/config/logger.ts`

**Configuración del logger:**
```typescript
import winston from 'winston';

const logLevel = process.env.LOG_LEVEL || 'info';
const serviceName = 'service-name';

const logger = winston.createLogger({
    level: logLevel,
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    defaultMeta: {
        service: serviceName,
    },
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json()
            ),
        }),
    ],
});

export default logger;
```

### Uso

Todos los `console.log`, `console.error`, `console.warn` han sido reemplazados por:

```typescript
// Info
logger.info({ message: 'Database initialized' });

// Error
logger.error({ 
    message: 'Error processing event',
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined
});

// Warning
logger.warn({ message: 'Collection appears corrupted', collection_name });
```

## Servicios Python (FastAPI)

### Dependencias agregadas

- **structlog**: `24.1.0` - Librería de logging estructurado para Python

### Configuración

Cada servicio Python tiene un módulo de logger en:
- `services/vectorization-service/src/infrastructure/config/logger.py`
- `services/ai-chat-service/src/infrastructure/config/logger.py`

**Configuración del logger:**
```python
import structlog
import sys
import os

# Configurar structlog para JSON
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        structlog.processors.JSONRenderer()
    ],
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    wrapper_class=structlog.stdlib.BoundLogger,
    cache_logger_on_first_use=True,
)

# Obtener nivel de log desde variable de entorno
log_level = os.getenv("LOG_LEVEL", "INFO").upper()

# Configurar logging estándar
import logging
logging.basicConfig(
    format="%(message)s",
    stream=sys.stdout,
    level=getattr(logging, log_level, logging.INFO),
)

# Crear logger con contexto del servicio
logger = structlog.get_logger().bind(service="service-name")
```

### Uso

Todos los `print()` han sido reemplazados por:

```python
# Info
logger.info("Database initialized")

# Error
logger.error("Error processing document", 
    document_id=document_id, 
    error=str(e), 
    exc_info=True
)

# Warning
logger.warning("Collection appears corrupted", collection_name=collection_name)

# Debug
logger.debug("Querying ChromaDB", limit=limit, embedding_dim=len(query_embedding))
```

## Formato de Salida

Todos los logs se emiten en formato JSON estructurado:

```json
{
  "timestamp": "2025-01-15T10:30:45.123Z",
  "level": "info",
  "service": "auth-service",
  "message": "Database initialized"
}
```

```json
{
  "timestamp": "2025-01-15T10:30:45.123Z",
  "level": "error",
  "service": "user-service",
  "message": "Error processing event",
  "error": "Connection timeout",
  "stack": "Error: Connection timeout\n    at ..."
}
```

## Variables de Entorno

- `LOG_LEVEL`: Nivel de logging (debug, info, warn, error). Por defecto: `info`

## Archivos Modificados

### auth-service
- `src/infrastructure/config/logger.ts` (nuevo)
- `src/main.ts`
- `src/infrastructure/config/database.ts`
- `src/infrastructure/service/JwtTokenService.ts`
- `src/presentation/middlewares/errorHandler.ts`
- `src/infrastructure/messaging/KafkaEventPublisher.ts`
- `package.json` (agregado winston)

### user-service
- `src/infrastructure/config/logger.ts` (nuevo)
- `src/main.ts`
- `src/infrastructure/config/database.ts`
- `src/infrastructure/config/redis.ts`
- `src/infrastructure/cache/RedisCacheService.ts`
- `src/infrastructure/messaging/KafkaEventPublisher.ts`
- `src/infrastructure/messaging/KafkaEventConsumer.ts`
- `src/presentation/middlewares/errorHandler.ts`
- `package.json` (agregado winston)

### audit-service
- `src/infrastructure/config/logger.ts` (nuevo)
- `src/main.ts`
- `src/infrastructure/config/database.ts`
- `src/infrastructure/persistence/MongoAuditLogRepository.ts`
- `src/infrastructure/messaging/KafkaEventConsumer.ts`
- `src/presentation/middlewares/errorHandler.ts`
- `package.json` (agregado winston)

### vectorization-service
- `src/infrastructure/config/logger.py` (nuevo)
- `src/main.py`
- `src/infrastructure/vector_db/chroma_vector_repository.py`
- `src/infrastructure/messaging/kafka_event_publisher.py`
- `src/infrastructure/messaging/kafka_event_consumer.py`
- `requirements.txt` (agregado structlog)

### ai-chat-service
- `src/infrastructure/config/logger.py` (nuevo)
- `src/main.py`
- `src/application/use_cases/send_message_use_case.py`
- `src/infrastructure/vector_db/chroma_vector_search.py`
- `src/infrastructure/repositories/redis_prompt_repository.py`
- `src/infrastructure/messaging/kafka_event_publisher.py`
- `requirements.txt` (agregado structlog)

## Verificación

Para verificar que el logging estructurado está funcionando:

1. Ejecutar cualquier servicio
2. Los logs deberían aparecer en formato JSON en la consola
3. Ejemplo de salida:
   ```json
   {"timestamp":"2025-01-15T10:30:45.123Z","level":"info","service":"auth-service","message":"Database initialized"}
   ```

## Beneficios

- **Estructurado**: Logs en formato JSON fácilmente parseable
- **Contexto**: Cada log incluye información del servicio y contexto relevante
- **Stack traces**: Errores incluyen stack traces completos
- **Niveles**: Soporte para diferentes niveles de logging (debug, info, warn, error)
- **Centralización**: Fácil integración con sistemas de logging centralizados (ELK, Loki, etc.)
