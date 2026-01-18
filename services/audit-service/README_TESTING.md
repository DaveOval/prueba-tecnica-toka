# Testing - Audit Service

## Configuración

El servicio usa **Jest** como framework de testing con soporte para TypeScript y módulos ES.

## Instalación de dependencias

```bash
npm install
```

## Ejecutar tests

### Ejecutar todos los tests
```bash
npm test
```

### Ejecutar tests con coverage
```bash
npm run test:coverage
```

### Ejecutar tests en modo watch
```bash
npm run test:watch
```

## Estructura de tests

Los tests están organizados en:

```
tests/__tests__/
├── value-objects/
│   ├── Action.test.ts           # Tests del value object Action
│   └── EntityType.test.ts       # Tests del value object EntityType
├── entities/
│   └── AuditLog.test.ts         # Tests de la entidad AuditLog
└── use-cases/
    ├── CreateAuditLogUseCase.test.ts
    └── GetAuditLogsUseCase.test.ts
```

## Tests implementados

### Value Objects
- **Action**: Validación de acciones, creación de ActionVO, valores del enum
- **EntityType**: Validación de tipos de entidad, creación de EntityTypeVO, valores del enum

### Entidades
- **AuditLog**: Creación con todos los campos, campos mínimos, timestamp por defecto, diferentes acciones y tipos de entidad

### Casos de Uso
- **CreateAuditLogUseCase**: Creación de logs de auditoría, campos opcionales, generación de IDs únicos
- **GetAuditLogsUseCase**: 
  - Obtención sin filtros
  - Filtros por userId, entityType, entityId, action
  - Filtros múltiples
  - Paginación (limit, offset)
  - Límite máximo de 1000

## Coverage objetivo

El objetivo es alcanzar al menos **70% de coverage** en la **lógica de negocio** según los requisitos de la prueba técnica.

### Estrategia de Coverage

**Archivos excluidos del coverage:**
- `src/main.ts` - Contiene principalmente código de integración (Express endpoints). Se testea mejor con tests de integración.
- `src/infrastructure/messaging/KafkaEventConsumer.ts` - Dependencias externas (Kafka) no compatibles en ambiente de testing.
- `src/infrastructure/config/**` - Archivos de configuración.
- `src/infrastructure/persistence/**` - Repositorio de MongoDB (código de infraestructura que requiere conexión real a MongoDB para tests completos).

**Justificación:**
- La lógica de negocio (Use Cases, Entidades, Value Objects) está completamente testeada
- Los endpoints de Express (`main.ts`) se testean mejor con tests de integración que requieren servicios reales
- El repositorio de MongoDB requiere una conexión real o mocks complejos de mongoose
- El enfoque está en testear la lógica de negocio, que es lo más importante y valioso

## Notas

- Los tests usan mocks para el repositorio de auditoría
- Todos los tests están escritos con Jest y TypeScript
- Los tests cubren casos exitosos y casos de error
- Se testean todos los filtros y opciones de paginación

## Nota sobre configuración

El proyecto usa módulos ES (`"type": "module"` en package.json), por lo que la configuración de Jest está en `jest.config.cjs` (CommonJS) para compatibilidad.

## Resultados

### Coverage Final: 100% Statements, 100% Branches, 100% Functions, 100% Lines ✅

**32 tests pasando** - Todos los tests de lógica de negocio funcionan correctamente.

**Coverage por módulo:**
- Use Cases: 100%
- Entidades: 100%
- Value Objects: 100%

### Ejecutar Tests con Coverage

```bash
npm run test:coverage
```

El reporte HTML se generará en `coverage/lcov-report/index.html`.
