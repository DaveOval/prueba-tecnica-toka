#!/bin/sh
set -e

echo "Installing dependencies..."
cd /app
npm install --legacy-peer-deps

echo "Starting application..."
exec "$@"
