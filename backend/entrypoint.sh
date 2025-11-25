#!/usr/bin/env sh
set -e

# Wait for Postgres to become available, then run migrations and exec the CMD
DB_HOST=${DB_HOST:-postgres}
DB_PORT=${DB_PORT:-5432}
DB_USER=${POSTGRES_USER:-postgres}

echo "Waiting for Postgres at $DB_HOST:$DB_PORT..."
until pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" > /dev/null 2>&1; do
  sleep 1
done

echo "Postgres is available - running migrations"
alembic upgrade head || true

echo "Starting app"
exec "$@"
