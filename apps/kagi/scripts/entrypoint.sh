#!/bin/sh
set -e

echo "Running database migrations..."
node /app/migrate/scripts/migrate.mjs
echo "Migrations complete."

echo "Starting application..."
exec node apps/kagi/server.js
