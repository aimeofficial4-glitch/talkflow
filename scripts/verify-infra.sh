#!/usr/bin/env bash
# ============================================================================
# TalkFlow Infrastructure Verification Script
# Checks docker, docker-compose, starts containers, and validates healthchecks
# ============================================================================

set -e

echo "🚀 [1/4] Checking Docker and Docker Compose availability..."
if ! command -v docker &> /dev/null; then
    echo "❌ Docker CLI not found. Please install Docker Engine or Docker Desktop."
    exit 1
fi

echo "📦 [2/4] Validating docker-compose.yml configuration syntax..."
docker compose config > /dev/null
echo "✅ docker-compose.yml syntax is valid."

echo "🔄 [3/4] Launching PostgreSQL and Redis in detached mode..."
docker compose up -d

echo "⏳ [4/4] Waiting for PostgreSQL and Redis healthchecks to pass..."
ATTEMPTS=0
MAX_ATTEMPTS=30

until [ "$ATTEMPTS" -ge "$MAX_ATTEMPTS" ]; do
  PG_STATUS=$(docker inspect --format='{{json .State.Health.Status}}' talkflow-postgres 2>/dev/null || echo '"starting"')
  REDIS_STATUS=$(docker inspect --format='{{json .State.Health.Status}}' talkflow-redis 2>/dev/null || echo '"starting"')

  echo "  - PostgreSQL: ${PG_STATUS}, Redis: ${REDIS_STATUS}"

  if [ "$PG_STATUS" = '"healthy"' ] && [ "$REDIS_STATUS" = '"healthy"' ]; then
    echo "🎉 All TalkFlow infrastructure services are HEALTHY!"
    echo "   - PostgreSQL listening on 5432 (database: talkflow, schema: app)"
    echo "   - Redis listening on 6379 (auth enabled, maxmemory volatile-lru)"
    exit 0
  fi

  ATTEMPTS=$((ATTEMPTS+1))
  sleep 2
done

echo "⚠️ Timed out waiting for containers to become healthy."
docker compose logs
exit 1
