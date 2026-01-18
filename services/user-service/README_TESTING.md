# Testing - User Service

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
│   └── Email.test.ts           # Tests del value object Email
├── entities/
│   └── UserProfile.test.ts    # Tests de la entidad UserProfile
├── services/
│   └── UserDomainService.test.ts  # Tests del servicio de dominio
├── infrastructure/
│   └── RedisCacheService.test.ts  # Tests del servicio de cache
└── use-cases/
    ├── CreateUserProfileUseCase.test.ts
    ├── GetUserProfileUseCase.test.ts
    ├── UpdateUserProfileUseCase.test.ts
    ├── DeleteUserProfileUseCase.test.ts
    └── GetAllUsersUseCase.test.ts
```

## Tests implementados

### Value Objects
- **Email**: Validación de formato, normalización, comparación

### Entidades
- **UserProfile**: Creación, reconstitución, actualización de perfil, getters

### Servicios de Dominio
- **UserDomainService**: 
  - Creación de perfiles
  - Actualización de perfiles
  - Obtención de perfiles
  - Obtención de todos los perfiles
  - Eliminación de perfiles

### Servicios de Infraestructura
- **RedisCacheService**: Get, set, delete, deletePattern, exists, clear

### Casos de Uso
- **CreateUserProfileUseCase**: Creación de perfiles con cache y eventos
- **GetUserProfileUseCase**: Obtención con cache (cache-first)
- **UpdateUserProfileUseCase**: Actualización con invalidación de cache y eventos
- **DeleteUserProfileUseCase**: Eliminación con invalidación de cache y eventos
- **GetAllUsersUseCase**: Obtención de todos los perfiles

## Coverage objetivo

El objetivo es alcanzar al menos **70% de coverage** en la **lógica de negocio** según los requisitos de la prueba técnica.

### Estrategia de Coverage

**Archivos excluidos del coverage:**
- `src/main.ts` - Contiene principalmente código de integración (Express endpoints). Se testea mejor con tests de integración.
- `src/infrastructure/messaging/KafkaEventPublisher.ts` - Dependencias externas (Kafka) no compatibles en ambiente de testing.
- `src/infrastructure/messaging/KafkaEventConsumer.ts` - Dependencias externas (Kafka) no compatibles en ambiente de testing.
- `src/infrastructure/config/**` - Archivos de configuración.
- `src/infrastructure/persistence/**` - Repositorio de PostgreSQL (código de infraestructura que requiere conexión real a PostgreSQL para tests completos).
- `src/presentation/**` - Controladores y middlewares (se testean mejor con tests de integración).

**Justificación:**
- La lógica de negocio (Use Cases, Servicios de Dominio, Entidades, Value Objects) está completamente testeada
- Los endpoints de Express (`main.ts`) se testean mejor con tests de integración que requieren servicios reales
- El repositorio de PostgreSQL requiere una conexión real o mocks complejos de Prisma
- El enfoque está en testear la lógica de negocio, que es lo más importante y valioso

## Notas

- Los tests usan mocks para servicios externos (Repository, Cache, Event Publisher)
- Todos los tests están escritos con Jest y TypeScript
- Los tests cubren casos exitosos y casos de error
- Se testean funcionalidades de cache (cache-first, invalidación)

## Nota sobre configuración

El proyecto usa módulos ES (`"type": "module"` en package.json), por lo que la configuración de Jest está en `jest.config.cjs` (CommonJS) para compatibilidad.

## Resultados

### Coverage Final: 100% Statements, 100% Branches, 100% Functions, 100% Lines ✅

**57 tests pasando** - Todos los tests de lógica de negocio funcionan correctamente.

**Coverage por módulo:**
- Use Cases: 100%
- Entidades: 100%
- Servicios de Dominio: 100%
- Value Objects: 100%
- Servicios de Infraestructura (RedisCacheService): 100%

### Ejecutar Tests con Coverage

```bash
npm run test:coverage
```

El reporte HTML se generará en `coverage/lcov-report/index.html`.
