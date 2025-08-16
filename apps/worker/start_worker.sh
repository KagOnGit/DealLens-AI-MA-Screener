#!/bin/bash

# DealLens Celery Worker Startup Script

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Set default values if not provided
export REDIS_HOST=${REDIS_HOST:-localhost}
export REDIS_PORT=${REDIS_PORT:-6379}
export REDIS_DB=${REDIS_DB:-0}
export DATABASE_URL=${DATABASE_URL:-postgresql://user:password@localhost/deallens}

# Celery worker configuration
export CELERY_LOGLEVEL=${CELERY_LOGLEVEL:-info}
export CELERY_CONCURRENCY=${CELERY_CONCURRENCY:-2}

echo "Starting DealLens Celery Worker..."
echo "Redis: redis://${REDIS_HOST}:${REDIS_PORT}/${REDIS_DB}"
echo "Database: ${DATABASE_URL}"
echo "Log Level: ${CELERY_LOGLEVEL}"
echo "Concurrency: ${CELERY_CONCURRENCY}"

# Start Celery worker
celery -A app worker \
    --loglevel=${CELERY_LOGLEVEL} \
    --concurrency=${CELERY_CONCURRENCY} \
    --task-events \
    --time-limit=3600 \
    --soft-time-limit=3000
