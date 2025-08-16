#!/bin/bash

# DealLens Celery Beat Scheduler Startup Script

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Set default values if not provided
export REDIS_HOST=${REDIS_HOST:-localhost}
export REDIS_PORT=${REDIS_PORT:-6379}
export REDIS_DB=${REDIS_DB:-0}
export DATABASE_URL=${DATABASE_URL:-postgresql://user:password@localhost/deallens}

# Celery beat configuration
export CELERY_LOGLEVEL=${CELERY_LOGLEVEL:-info}
export CELERY_BEAT_SCHEDULE_FILENAME=${CELERY_BEAT_SCHEDULE_FILENAME:-celerybeat-schedule}

echo "Starting DealLens Celery Beat Scheduler..."
echo "Redis: redis://${REDIS_HOST}:${REDIS_PORT}/${REDIS_DB}"
echo "Database: ${DATABASE_URL}"
echo "Log Level: ${CELERY_LOGLEVEL}"
echo "Schedule File: ${CELERY_BEAT_SCHEDULE_FILENAME}"

# Start Celery beat scheduler
celery -A app beat \
    --loglevel=${CELERY_LOGLEVEL} \
    --schedule=${CELERY_BEAT_SCHEDULE_FILENAME} \
    --pidfile=celerybeat.pid
