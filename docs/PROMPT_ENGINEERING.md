# Documentación de Prompt Engineering

## Estrategia de Prompt Engineering

El sistema implementa una estrategia de prompt engineering basada en templates configurables almacenados en Redis, permitiendo modificar el comportamiento del agente de IA sin cambios en el código.

## Arquitectura de Prompts

### Componentes

1. **System Prompt**: Define el rol y comportamiento general del asistente
2. **User Prompt Template**: Template para formatear mensajes del usuario con contexto
3. **Prompt Repository**: Almacenamiento en Redis con CRUD completo

### Flujo de Construcción de Prompts

```
1. Usuario envía mensaje
2. Sistema obtiene prompt template de Redis (o usa default)
3. Si RAG está activo:
   - Genera embedding del mensaje
   - Busca chunks similares en ChromaDB
   - Construye contexto con chunks relevantes
4. Formatea user prompt con contexto
5. Envía a LLM: [System Prompt] + [User Prompt con contexto]
6. Retorna respuesta
```

## Estructura de Prompts

### System Prompt (Default)

```
Eres un asistente útil. Responde preguntas basándote en el contexto proporcionado.
Si el contexto no contiene información relevante, indica que no tienes esa información.
Sé conciso y preciso en tus respuestas.
```

**Características**:
- Define el rol del asistente
- Establece comportamiento cuando falta contexto
- Guía el estilo de respuesta

### User Prompt Template

El template incluye:
- Mensaje del usuario
- Contexto RAG (chunks relevantes)
- Historial de conversación (si existe)

**Formato**:
```
Contexto relevante:
{context_chunks}

Historial de conversación:
{conversation_history}

Pregunta del usuario: {user_message}
```

## Estrategias Implementadas

### 1. RAG (Retrieval-Augmented Generation)

**Objetivo**: Mejorar precisión usando documentos internos

**Implementación**:
- Detección de consultas genéricas (saludos) que no requieren búsqueda
- Búsqueda semántica con threshold de similitud (0.7)
- Límite de chunks de contexto (5 chunks)
- Formateo estructurado del contexto

**Ejemplo de contexto formateado**:
```
Contexto relevante:
[Documento: manual.pdf, Chunk 1]
Información sobre el producto X...

[Documento: manual.pdf, Chunk 2]
Especificaciones técnicas...
```

### 2. Few-Shot Examples

El sistema puede incluir ejemplos en el system prompt para guiar el comportamiento:

```
Ejemplos de respuestas:
- Pregunta: "¿Qué es X?" → Respuesta: "X es un componente que..."
- Pregunta: "¿Cómo funciona Y?" → Respuesta: "Y funciona mediante..."
```

### 3. Chain-of-Thought (Implícito)

El prompt guía al modelo a razonar paso a paso cuando es necesario:

```
Para responder, primero identifica:
1. Qué información del contexto es relevante
2. Cómo se relaciona con la pregunta
3. Qué respuesta es más precisa
```

## Gestión de Prompts

### CRUD de Prompts

El sistema permite gestionar prompts mediante API:

- **GET /api/ai/prompts**: Listar todos los prompts
- **POST /api/ai/prompts**: Crear nuevo prompt
- **PUT /api/ai/prompts/{id}**: Actualizar prompt
- **DELETE /api/ai/prompts/{id}**: Eliminar prompt

### Estructura de Prompt Template

```json
{
  "id": "uuid",
  "name": "Nombre del prompt",
  "systemPrompt": "Eres un asistente...",
  "userPromptTemplate": "Contexto: {context}\nPregunta: {message}",
  "isDefault": false,
  "createdAt": "2025-01-01T00:00:00Z"
}
```

## Optimización de Prompts

### Consideraciones de Tokens

- **System Prompt**: Mantener conciso (50-200 tokens)
- **Contexto RAG**: Limitar a 5 chunks relevantes
- **Historial**: Máximo 10 mensajes previos
- **Total**: Objetivo < 4000 tokens para gpt-4o-mini

### Estrategias de Reducción de Costos

1. **Detección de consultas genéricas**: Evita búsqueda RAG innecesaria
2. **Threshold de similitud**: Solo incluye chunks muy relevantes (score > 0.7)
3. **Límite de chunks**: Máximo 5 chunks por consulta
4. **Modelo eficiente**: Uso de gpt-4o-mini en lugar de gpt-4

### Mejora de Calidad

1. **Contexto estructurado**: Formato claro con metadatos (documento, chunk)
2. **Instrucciones explícitas**: Guías claras en system prompt
3. **Validación de contexto**: Verificar que chunks sean relevantes antes de incluir

## Ejemplos de Prompts

### Prompt para Soporte Técnico

**System Prompt**:
```
Eres un asistente de soporte técnico. Responde preguntas basándote en la documentación proporcionada.
Si no encuentras información relevante en el contexto, indica que necesitas más detalles.
Siempre proporciona pasos claros y numerados cuando sea apropiado.
```

**User Template**:
```
Documentación relevante:
{context}

Pregunta del usuario: {message}

Responde de forma clara y estructurada.
```

### Prompt para Análisis de Datos

**System Prompt**:
```
Eres un analista de datos. Analiza la información proporcionada y extrae insights relevantes.
Presenta tus hallazgos de forma estructurada con conclusiones claras.
```

## Evaluación de Prompts

### Métricas Monitoreadas

1. **Latencia**: Tiempo de respuesta del LLM
2. **Tokens**: Input tokens, output tokens, total tokens
3. **Costo**: Cálculo basado en tokens y modelo usado
4. **Calidad**: Evaluación manual (futuro: métricas automáticas)

### Almacenamiento de Métricas

Las métricas se almacenan en Redis y PostgreSQL:
- Redis: Métricas agregadas (total de tokens, costo total)
- PostgreSQL: Evaluaciones individuales por conversación

## Mejores Prácticas

### 1. System Prompts

- Ser específico sobre el rol del asistente
- Definir límites claros (qué puede y no puede hacer)
- Incluir instrucciones sobre manejo de información faltante
- Mantener longitud razonable (< 200 tokens)

### 2. Contexto RAG

- Incluir solo chunks altamente relevantes (score > 0.7)
- Formatear contexto con metadatos claros
- Limitar cantidad de contexto (5 chunks máximo)
- Verificar relevancia antes de incluir

### 3. Templates

- Usar placeholders claros: {context}, {message}, {history}
- Documentar cada placeholder
- Probar templates con diferentes inputs
- Versionar templates importantes

### 4. Optimización

- Monitorear uso de tokens
- Ajustar límites según costos
- Probar diferentes modelos según caso de uso
- Iterar basándose en métricas

## Integración con el Sistema

### Flujo Completo

1. Usuario selecciona o usa prompt default
2. Sistema carga prompt de Redis
3. Si RAG activo, busca contexto relevante
4. Construye prompt final con contexto
5. Envía a OpenAI
6. Almacena respuesta y métricas
7. Retorna al usuario

### Configuración

Variables de entorno relevantes:
- `DEFAULT_SYSTEM_PROMPT`: Prompt por defecto
- `LLM_MODEL`: Modelo a usar (gpt-4o-mini, gpt-4, etc.)
- `EMBEDDING_MODEL`: Modelo para embeddings
- `CHROMA_COLLECTION_NAME`: Colección de documentos

## Casos de Uso

### Consulta con Contexto

Usuario pregunta sobre información en documentos subidos:
1. Sistema detecta que no es consulta genérica
2. Genera embedding de la pregunta
3. Busca chunks similares
4. Construye prompt con contexto
5. LLM responde con información precisa

### Consulta Genérica

Usuario envía saludo o pregunta general:
1. Sistema detecta consulta genérica
2. Omite búsqueda RAG
3. Construye prompt sin contexto
4. LLM responde de forma conversacional

### Análisis de Documentos

Usuario solicita análisis de documentos:
1. Sistema busca chunks relevantes
2. Agrega instrucciones de análisis en system prompt
3. Proporciona contexto estructurado
4. LLM genera análisis estructurado

## Futuras Mejoras

1. **Validación automática de calidad**: Métricas para evaluar relevancia de respuestas
2. **A/B Testing**: Probar diferentes prompts y comparar resultados
3. **Fine-tuning**: Ajustar prompts basándose en feedback de usuarios
4. **Templates dinámicos**: Generar prompts según tipo de consulta
5. **Caché de respuestas**: Almacenar respuestas frecuentes para reducir costos
