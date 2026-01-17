#!/bin/sh
set -e

echo "📦 Installing dependencies..."
cd /app
npm install --legacy-peer-deps

echo "🔧 Generating Prisma Client..."
# Guardar DATABASE_URL original
ORIGINAL_DB_URL=$DATABASE_URL
# Prisma generate no necesita DATABASE_URL real, pero el config lo requiere
# Usamos una URL dummy si no existe solo para generate
export DATABASE_URL=${DATABASE_URL:-"postgresql://dummy:dummy@localhost:5432/dummy"}
npm run prisma:generate

echo "🗄️  Waiting for database and pushing schema..."
# Restaurar DATABASE_URL original para db push
if [ -n "$ORIGINAL_DB_URL" ]; then
  export DATABASE_URL=$ORIGINAL_DB_URL
else
  echo "❌ DATABASE_URL environment variable is not set. Cannot push schema."
  exit 1
fi

# Función para intentar push del schema con reintentos
push_schema_with_retry() {
  max_attempts=30
  attempt=1
  
  while [ $attempt -le $max_attempts ]; do
    echo "⏳ Attempting to push database schema... (attempt $attempt/$max_attempts)"
    
    if npx prisma db push --accept-data-loss 2>&1; then
      echo "✅ Database schema pushed successfully!"
      return 0
    fi
    
    if [ $attempt -lt $max_attempts ]; then
      echo "⏳ Database not ready yet, waiting 2 seconds..."
      sleep 2
    fi
    
    attempt=$((attempt + 1))
  done
  
  echo "❌ Failed to push database schema after $max_attempts attempts"
  return 1
}

# Intentar push del schema con reintentos
if ! push_schema_with_retry; then
  echo "❌ Failed to push database schema. Exiting..."
  exit 1
fi

echo "✅ Dependencies installed, Prisma Client generated, and database schema pushed"
echo "🚀 Starting application..."
exec "$@"
