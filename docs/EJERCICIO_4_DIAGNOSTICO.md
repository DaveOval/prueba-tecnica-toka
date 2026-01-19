# Ejercicio 4: Diagnóstico - Resolución de Problema

## Escenario

**Problema reportado**: Los usuarios no pueden guardar registros, algunos microservicios responden con errores 500, y hay reportes de alta latencia en las respuestas de agentes de IA.

## Hipótesis de Causas

### Prioridad Alta

1. **Problema de base de datos**
   - PostgreSQL con conexiones agotadas o timeout
   - MongoDB sin conexiones disponibles
   - Posible deadlock o transacciones bloqueadas

2. **Problema de comunicación entre servicios**
   - Kafka no disponible o con alta latencia
   - Timeout en llamadas REST entre servicios
   - Circuit breaker activado por fallos previos

3. **Problema con servicios de IA**
   - Rate limiting de OpenAI API alcanzado
   - Timeout en llamadas a OpenAI
   - ChromaDB sin respuesta o lento

### Prioridad Media

4. **Problema de recursos del sistema**
   - CPU o memoria agotada en contenedores
   - Redis sin memoria disponible
   - Network congestion entre servicios

5. **Problema de configuración**
   - Variables de entorno incorrectas
   - Secrets expirados o inválidos
   - Healthchecks fallando

### Prioridad Baja

6. **Problema de código**
   - Bug reciente en deployment
   - Error no manejado causando crash
   - Memory leak en algún servicio

## Plan de Diagnóstico Sistemático

### Fase 1: Verificación de Salud General (5 minutos)

**Acciones**:
1. Verificar healthchecks de todos los servicios
   ```bash
   curl http://localhost:3000/health  # auth-service
   curl http://localhost:3001/health   # user-service
   curl http://localhost:3002/health   # audit-service
   curl http://localhost:3003/health   # vectorization-service
   curl http://localhost:3004/health   # ai-chat-service
   ```

2. Verificar estado de contenedores
   ```bash
   docker-compose ps
   docker stats
   ```

3. Verificar logs de errores recientes
   ```bash
   docker-compose logs --tail=100 --timestamps | grep -i error
   ```

**Resultado esperado**: Identificar qué servicios están fallando

### Fase 2: Diagnóstico de Bases de Datos (10 minutos)

**PostgreSQL**:
```bash
# Conectar a PostgreSQL
docker exec -it prueba-tecnica-toka-postgres-1 psql -U postgres

# Verificar conexiones activas
SELECT count(*) FROM pg_stat_activity;

# Verificar locks
SELECT * FROM pg_locks WHERE NOT granted;

# Verificar espacio en disco
SELECT pg_size_pretty(pg_database_size('auth_db'));
```

**MongoDB**:
```bash
# Conectar a MongoDB
docker exec -it prueba-tecnica-toka-mongodb-1 mongosh -u admin -p admin

# Verificar conexiones
db.serverStatus().connections

# Verificar operaciones lentas
db.currentOp({"secs_running": {"$gt": 5}})
```

**Redis**:
```bash
# Conectar a Redis
docker exec -it prueba-tecnica-toka-redis-1 redis-cli

# Verificar memoria
INFO memory

# Verificar conexiones
INFO clients
```

**ChromaDB**:
```bash
# Verificar health
curl http://localhost:8000/api/v1/heartbeat

# Verificar colecciones
curl http://localhost:8000/api/v1/collections
```

### Fase 3: Diagnóstico de Comunicación (10 minutos)

**Kafka**:
```bash
# Verificar brokers
docker exec -it prueba-tecnica-toka-kafka-1 kafka-broker-api-versions --bootstrap-server localhost:9092

# Verificar topics y mensajes
docker exec -it prueba-tecnica-toka-kafka-1 kafka-topics --list --bootstrap-server localhost:9092
docker exec -it prueba-tecnica-toka-kafka-1 kafka-console-consumer --bootstrap-server localhost:9092 --topic audit.event --from-beginning
```

**REST entre servicios**:
- Verificar logs de llamadas HTTP entre servicios
- Buscar timeouts o errores 500 en logs
- Verificar JWT validation funcionando

### Fase 4: Diagnóstico de Servicios de IA (10 minutos)

**OpenAI API**:
```bash
# Verificar rate limits en logs
docker-compose logs ai-chat-service | grep -i "rate limit"

# Verificar errores de API
docker-compose logs ai-chat-service | grep -i "openai"

# Verificar latencia en métricas
# Revisar Redis para métricas de latencia almacenadas
```

**ChromaDB para RAG**:
```bash
# Verificar latencia de búsquedas
# Revisar logs de ai-chat-service para tiempos de búsqueda

# Verificar cantidad de documentos
curl http://localhost:8000/api/v1/collections/documents/count
```

**Embeddings**:
- Verificar logs de vectorization-service
- Verificar errores en generación de embeddings
- Verificar latencia de OpenAI embeddings API

### Fase 5: Análisis de Logs Centralizados (15 minutos)

**Estrategia de logs centralizados**:

1. **Agregar logs estructurados** (si no están implementados):
   - Implementar logging JSON en todos los servicios
   - Incluir: timestamp, service, level, message, context, error details

2. **Centralizar logs**:
   - Opción 1: Docker logs con timestamps
     ```bash
     docker-compose logs --tail=1000 --timestamps > logs_$(date +%Y%m%d_%H%M%S).log
     ```
   - Opción 2: Enviar a sistema centralizado (ELK, Loki, etc.)

3. **Análisis de patrones**:
   ```bash
   # Buscar errores 500
   grep "500" logs_*.log | tail -50
   
   # Buscar timeouts
   grep -i "timeout" logs_*.log | tail -50
   
   # Buscar errores de base de datos
   grep -i "database\|postgres\|mongo" logs_*.log | grep -i error | tail -50
   
   # Buscar errores de OpenAI
   grep -i "openai\|rate limit" logs_*.log | tail -50
   ```

4. **Correlación temporal**:
   - Identificar momento exacto del inicio del problema
   - Comparar logs de todos los servicios en ese momento
   - Buscar eventos que precedieron al problema

## Problemas Específicos de Agentes IA

### Alta Latencia en Respuestas

**Causas posibles**:
1. Rate limiting de OpenAI API
2. ChromaDB lento o sin respuesta
3. Embeddings API con alta latencia
4. Búsqueda RAG con muchos chunks

**Diagnóstico**:
```bash
# Revisar métricas de latencia en Redis
docker exec -it prueba-tecnica-toka-redis-1 redis-cli
KEYS *metrics*
GET ai:metrics:average_latency

# Revisar logs de latencia
docker-compose logs ai-chat-service | grep -i "latency\|time"
```

**Soluciones**:
- Implementar caché de respuestas frecuentes
- Reducir cantidad de chunks en búsqueda RAG
- Usar modelo más rápido (gpt-4o-mini vs gpt-4)
- Implementar timeout y fallback

### Costos Elevados de Tokens

**Causas posibles**:
1. Contexto RAG demasiado grande
2. Prompts muy largos
3. Muchas consultas simultáneas
4. Modelo costoso (gpt-4 vs gpt-4o-mini)

**Diagnóstico**:
```bash
# Revisar métricas de tokens
docker exec -it prueba-tecnica-toka-redis-1 redis-cli
GET ai:metrics:total_tokens
GET ai:metrics:total_cost
```

**Soluciones**:
- Limitar contexto RAG a chunks más relevantes
- Optimizar system prompts
- Implementar límite de tokens por request
- Usar modelo más económico

### Rate Limiting de APIs

**Causas posibles**:
1. Demasiadas requests a OpenAI API
2. Límite de requests por minuto alcanzado
3. Sin implementación de retry con backoff

**Diagnóstico**:
```bash
# Buscar errores de rate limit
docker-compose logs ai-chat-service | grep -i "rate limit\|429"

# Verificar cantidad de requests
# Revisar métricas de requests por minuto
```

**Soluciones**:
- Implementar rate limiting local
- Implementar retry con exponential backoff
- Usar queue para procesar requests
- Considerar Azure OpenAI con mayor límite

## Comunicación a Stakeholders

### Reporte Inicial (15 minutos después del incidente)

**Formato**:
```
INCIDENTE: Problemas de guardado y alta latencia en IA
ESTADO: En investigación
INICIO: [timestamp]
IMPACTO: Usuarios no pueden guardar registros, respuestas de IA lentas
ACCIONES TOMADAS:
- Verificando healthchecks de servicios
- Revisando logs de errores
- Diagnosticando bases de datos
PRÓXIMOS PASOS:
- Identificar causa raíz
- Implementar solución
- Monitorear recuperación
ETA RESOLUCIÓN: [estimación basada en diagnóstico]
```

### Actualizaciones Periódicas

**Cada 30 minutos**:
- Estado actual del diagnóstico
- Hallazgos relevantes
- Acciones tomadas
- Nueva estimación de resolución

### Reporte Final

**Al resolver**:
```
INCIDENTE: Resuelto
DURACIÓN: [tiempo total]
CAUSA RAÍZ: [descripción]
SOLUCIÓN APLICADA: [detalles]
PREVENCIÓN: [medidas para evitar recurrencia]
```

## Checklist de Diagnóstico

- [ ] Verificar healthchecks de todos los servicios
- [ ] Revisar estado de contenedores (CPU, memoria)
- [ ] Verificar conexiones a bases de datos
- [ ] Revisar locks y transacciones en PostgreSQL
- [ ] Verificar estado de Kafka y mensajes en cola
- [ ] Revisar logs de errores recientes
- [ ] Verificar rate limits de OpenAI API
- [ ] Revisar latencia de ChromaDB
- [ ] Analizar métricas de tokens y costos
- [ ] Verificar configuración de variables de entorno
- [ ] Revisar logs centralizados para patrones
- [ ] Identificar momento exacto del inicio del problema
- [ ] Correlacionar eventos entre servicios

## Herramientas Recomendadas

**Para producción** (no implementadas en este proyecto, pero recomendadas):

1. **Logging centralizado**: ELK Stack, Loki, o CloudWatch
2. **APM**: New Relic, Datadog, o Application Insights
3. **Monitoring**: Prometheus + Grafana
4. **Tracing distribuido**: Jaeger o Zipkin
5. **Alertas**: PagerDuty, Opsgenie

**Para desarrollo local**:
- Docker logs con timestamps
- Healthchecks de servicios
- Métricas en Redis
- Logs estructurados (a implementar)
