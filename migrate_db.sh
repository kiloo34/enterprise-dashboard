#!/bin/bash

# Configuration
# These should match your host PostgreSQL and the new Docker PostgreSQL settings
SOURCE_HOST="host.docker.internal"
SOURCE_PORT="5433"
SOURCE_USER="postgres"
SOURCE_DB="ent-dash"
SOURCE_PASS="pekalongan12"

TARGET_CONTAINER="ent_dash_db"
TARGET_DB="ent-dash"
TARGET_USER="postgres"

DUMP_FILE="db_dump_$(date +%Y%m%d_%H%M%S).sql"

echo "Step 1: Dumping data from host database ($SOURCE_HOST:$SOURCE_PORT)..."
# We use a temporary container to perform the dump to ensure pg_dump is available and compatible
docker run --rm \
  -e PGPASSWORD=$SOURCE_PASS \
  --add-host=host.docker.internal:host-gateway \
  postgres:17-alpine \
  pg_dump -h $SOURCE_HOST -p $SOURCE_PORT -U $SOURCE_USER $SOURCE_DB > $DUMP_FILE

if [ $? -eq 0 ]; then
    echo "Dump successful: $DUMP_FILE"
else
    echo "Error: Dump failed."
    exit 1
fi

echo "Step 2: Restoring data to Docker container ($TARGET_CONTAINER)..."
# Check if target container is running
if ! docker ps | grep -q $TARGET_CONTAINER; then
    echo "Error: Target container $TARGET_CONTAINER is not running. Please run 'docker-compose up -d db' first."
    exit 1
fi

cat $DUMP_FILE | docker exec -i $TARGET_CONTAINER psql -U $TARGET_USER -d $TARGET_DB

if [ $? -eq 0 ]; then
    echo "Restore successful!"
    echo "You can now update your docker-compose.yml to point to the 'db' service."
else
    echo "Error: Restore failed."
    exit 1
fi

# Cleanup
# rm $DUMP_FILE
echo "Migration complete."
