#!/bin/bash
set -e

echo "Migrating IAM database..."
docker compose exec iam alembic upgrade head

echo "Migrating Engine database..."
docker compose exec engine alembic upgrade head

echo "Migrating Analytics database..."
docker compose exec analytics alembic upgrade head

echo "Migrating Recon API database..."
docker compose exec recon_api alembic upgrade head

echo "Migrating DW database..."
docker compose exec dw alembic upgrade head

echo "All databases migrated successfully!"
