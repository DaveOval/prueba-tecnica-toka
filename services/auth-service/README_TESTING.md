# Testing - Auth Service

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
│   ├── Email.test.ts           # Tests del value object Email
│   └── Password.test.ts        # Tests del value object Password
├── entities/
│   └── User.test.ts            # Tests de la entidad User
├── services/
│   └── AuthDomainService.test.ts  # Tests del servicio de dominio
├── infrastructure/
│   └── JwtTokenService.test.ts    # Tests del servicio JWT
└── use-cases/
    ├── RegisterUserUseCase.test.ts
    ├── LoginUseCase.test.ts
    ├── ActivateUserUseCase.test.ts
    ├── DeactivateUserUseCase.test.ts
    ├── ChangeUserRoleUseCase.test.ts
    ├── DeleteUserUseCase.test.ts
    └── GetAllUsersUseCase.test.ts
```

## Tests implementados

### Value Objects
- **Email**: Validación de formato, normalización, comparación
- **Password**: Creación, hash, comparación, validación de longitud

### Entidades
- **User**: Creación, reconstitución, activación/desactivación, cambio de contraseña, roles

### Servicios de Dominio
- **AuthDomainService**: 
  - Registro de usuarios
  - Activación/desactivación
  - Cambio de roles
  - Autenticación
  - Eliminación de usuarios

### Servicios de Infraestructura
- **JwtTokenService**: Generación y verificación de tokens (access y refresh)

### Casos de Uso
- **RegisterUserUseCase**: Registro de nuevos usuarios con eventos
- **LoginUseCase**: Autenticación y generación de tokens
- **ActivateUserUseCase**: Activación de usuarios
- **DeactivateUserUseCase**: Desactivación de usuarios (con validación de admin)
- **ChangeUserRoleUseCase**: Cambio de roles (con validación de admin)
- **DeleteUserUseCase**: Eliminación de usuarios (con validación de admin)
- **GetAllUsersUseCase**: Obtención de todos los usuarios

## Coverage objetivo

El objetivo es alcanzar al menos **70% de coverage** en la **lógica de negocio** según los requisitos de la prueba técnica.

### Estrategia de Coverage

**Archivos excluidos del coverage:**
- `src/main.ts` - Contiene principalmente código de integración (Express endpoints). Se testea mejor con tests de integración.
- `src/infrastructure/messaging/KafkaEventPublisher.ts` - Dependencias externas (Kafka) no compatibles en ambiente de testing.
- `src/infrastructure/config/**` - Archivos de configuración.

**Justificación:**
- La lógica de negocio (Use Cases, Servicios de Dominio, Entidades, Value Objects) está completamente testeada
- Los endpoints de Express (`main.ts`) se testean mejor con tests de integración que requieren servicios reales
- El enfoque está en testear la lógica de negocio, que es lo más importante y valioso

## Notas

- Los tests usan mocks para servicios externos (JWT, Event Publisher, Repository)
- Todos los tests están escritos con Jest y TypeScript
- Se usan fixtures compartidas para evitar duplicación
- Los tests cubren casos exitosos y casos de error

## Nota sobre configuración

El proyecto usa módulos ES (`"type": "module"` en package.json), por lo que la configuración de Jest está en `jest.config.cjs` (CommonJS) para compatibilidad.

## Resultados

### Coverage Final: 100% Statements, 88.09% Branches, 100% Functions, 100% Lines ✅

**65 tests pasando** - Todos los tests de lógica de negocio funcionan correctamente.

**Coverage por módulo:**
- Use Cases: 100% statements, 90% branches
- Entidades: 100%
- Servicios de Dominio: 100% statements, 83.33% branches
- Value Objects: 100%
- Servicios de Infraestructura (JwtTokenService): 100% statements, 80% branches

### Ejecutar Tests con Coverage

```bash
npm run test:coverage -- --config=jest.config.cjs
```

El reporte HTML se generará en `coverage/lcov-report/index.html`.
