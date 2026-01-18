# Guía de Testing - Front Service

## Configuración

## Instalación de dependencias

```bash
npm install
```

## Ejecutar tests

### Ejecutar todos los tests
```bash
npm test
```

### Ejecutar tests en modo watch (desarrollo)
```bash
npm test
# Vitest se ejecuta en modo watch por defecto
```

### Ejecutar tests con UI
```bash
npm run test:ui
```

### Ejecutar tests con coverage
```bash
npm run test:coverage
```

El reporte de coverage se generará en:
- `coverage/index.html` - Reporte HTML interactivo
- `coverage/coverage-final.json` - Reporte JSON
- Consola - Reporte de texto

## Estructura de tests

Los tests están organizados siguiendo la estructura del código fuente:

```
src/
├── pages/
│   ├── __tests__/
│   │   ├── LoginPage.test.tsx
│   │   └── AIPage.test.tsx
├── shared/
│   ├── hooks/
│   │   └── __tests__/
│   │       └── useAuth.test.tsx
│   └── service/
│       └── __tests__/
│           └── authService.test.ts
└── app/
    └── store/
        └── slices/
            └── __tests__/
                └── authSlice.test.ts
```

## Tests implementados

### Componentes
- **LoginPage**: Tests de renderizado, interacción de usuario, manejo de errores
- **AIPage**: Tests de renderizado, envío de mensajes, carga de prompts, manejo de errores

### Hooks
- **useAuth**: Tests de login, registro, logout, manejo de errores

### Servicios
- **authService**: Tests de todas las funciones (login, register, decodeToken, etc.)

### Redux Slices
- **authSlice**: Tests de acciones (login, logout, setUser)

## Utilidades de testing

### `renderWithProviders`
Helper para renderizar componentes con todos los providers necesarios (Redux, Router):

```typescript
import { renderWithProviders } from '../test/utils';

const { getByText } = renderWithProviders(<MyComponent />);
```

### Setup global
El archivo `src/test/setup.ts` configura:
- `@testing-library/jest-dom` para matchers adicionales
- Mocks de `localStorage`
- Mocks de `window.matchMedia`

## Coverage objetivo

El objetivo es alcanzar al menos **70% de coverage** según los requisitos de la prueba técnica.

## Próximos tests a implementar

- [ ] Tests para `HomePage`
- [ ] Tests para `UsersPage`
- [ ] Tests para `ProfilePage`
- [ ] Tests para `AIDocumentsPage`
- [ ] Tests para `AIPromptsPage`
- [ ] Tests para `AuditLogsPage`
- [ ] Tests para servicios adicionales (`userService`, `aiService`, `auditService`)
- [ ] Tests de integración para flujos completos
