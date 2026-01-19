# Arquitectura del Sistema - Prueba Técnica

## Diagrama de Arquitectura General

El siguiente diagrama muestra la arquitectura completa del sistema de microservicios:

```mermaid
graph TB
    subgraph "Frontend Layer"
        FE[Front Service<br/>React + TypeScript<br/>Port: 5173]
    end

    subgraph "API Gateway / Load Balancer"
        API[API Endpoints]
    end

    subgraph "Microservices Layer"
        AUTH[Auth Service<br/>Node.js/TypeScript<br/>Port: 3000]
        USER[User Service<br/>Node.js/TypeScript<br/>Port: 3001]
        AUDIT[Audit Service<br/>Node.js/TypeScript<br/>Port: 3002]
        VEC[Vectorization Service<br/>Python/FastAPI<br/>Port: 3003]
        AI[AI Chat Service<br/>Python/FastAPI<br/>Port: 3004]
    end

    subgraph "Message Broker"
        KAFKA[Kafka<br/>Port: 9092]
        ZK[Zookeeper<br/>Port: 2181]
    end

    subgraph "Data Layer"
        PG[(PostgreSQL<br/>Port: 5432)]
        MONGO[(MongoDB<br/>Port: 27017)]
        REDIS[(Redis<br/>Port: 6379)]
        CHROMA[(ChromaDB<br/>Port: 8000)]
    end

    subgraph "External Services"
        OPENAI[OpenAI API]
    end

    FE -->|HTTP/REST| AUTH
    FE -->|HTTP/REST| USER
    FE -->|HTTP/REST| AUDIT
    FE -->|HTTP/REST| VEC
    FE -->|HTTP/REST| AI

    AUTH -->|JWT Validation| USER
    AUTH -->|JWT Validation| AUDIT
    AUTH -->|JWT Validation| VEC
    AUTH -->|JWT Validation| AI

    AUTH -->|Read/Write| PG
    USER -->|Read/Write| PG
    VEC -->|Read/Write| PG
    AI -->|Read/Write| PG

    AUDIT -->|Write| MONGO

    AUTH -->|Cache| REDIS
    USER -->|Cache| REDIS
    AI -->|Prompts| REDIS

    VEC -->|Write| CHROMA
    AI -->|Read| CHROMA

    AUTH -->|Events| KAFKA
    USER -->|Events| KAFKA
    VEC -->|Events| KAFKA
    AI -->|Events| KAFKA

    KAFKA -->|Consume| AUDIT

    VEC -->|Embeddings| OPENAI
    AI -->|LLM| OPENAI
    AI -->|Embeddings| OPENAI

    KAFKA -.->|Coordination| ZK
```

## Diagrama de Flujo de Datos - Autenticación y Usuario

```mermaid
sequenceDiagram
    participant FE as Frontend
    participant AUTH as Auth Service
    participant USER as User Service
    participant PG as PostgreSQL
    participant KAFKA as Kafka
    participant AUDIT as Audit Service
    participant MONGO as MongoDB

    FE->>AUTH: POST /api/auth/register
    AUTH->>PG: Save user
    AUTH->>KAFKA: Publish user.registered
    AUTH-->>FE: JWT tokens

    FE->>AUTH: POST /api/auth/login
    AUTH->>PG: Validate credentials
    AUTH-->>FE: JWT tokens

    FE->>USER: GET /api/users/profile (with JWT)
    USER->>AUTH: Validate JWT
    AUTH-->>USER: Valid token
    USER->>PG: Get user profile
    USER->>REDIS: Check cache
    USER-->>FE: User profile

    USER->>KAFKA: Publish audit.event
    KAFKA->>AUDIT: Consume event
    AUDIT->>MONGO: Save audit log
```

## Diagrama de Flujo de Datos - RAG y Chat con IA

```mermaid
sequenceDiagram
    participant FE as Frontend
    participant AI as AI Chat Service
    participant VEC as Vectorization Service
    participant CHROMA as ChromaDB
    participant OPENAI as OpenAI API
    participant REDIS as Redis
    participant KAFKA as Kafka

    FE->>VEC: POST /api/ai/documents/upload
    VEC->>VEC: Process document (chunks)
    VEC->>OPENAI: Generate embeddings
    VEC->>CHROMA: Store embeddings
    VEC->>KAFKA: Publish document.processed
    VEC-->>FE: Document ID

    FE->>AI: POST /api/ai/chat (message)
    AI->>REDIS: Get prompt template
    AI->>OPENAI: Generate query embedding
    AI->>CHROMA: Search similar chunks
    CHROMA-->>AI: Context chunks
    AI->>OPENAI: Chat completion (with context)
    OPENAI-->>AI: Response
    AI->>REDIS: Store metrics (latency, tokens)
    AI->>KAFKA: Publish audit.event
    AI-->>FE: AI response
```

