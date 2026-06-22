#!/bin/bash
set -e

echo "======================================"
echo " Starting Harness Verification"
echo "======================================"

echo "1. Checking Docker Containers..."
docker compose up -d

echo "2. Waiting for services to stabilize..."
sleep 5

echo "3. Running IAM Tests..."
docker compose exec -T iam python -m pytest tests/ -v --tb=short

echo "4. Running Engine Tests..."
docker compose exec -T engine python -m pytest tests/ -v --tb=short

echo "5. Running Analytics Tests..."
docker compose exec -T analytics python -m pytest tests/ -v --tb=short

echo "6. Running Recon Tests..."
docker compose exec -T recon_api python -m pytest tests/ -v --tb=short

echo "7. Checking Frontend Compilation..."
cd ent-dash-fe
npm run build
cd ..

echo "======================================"
echo "✅ All Verifications Passed 100%"
echo "======================================"
