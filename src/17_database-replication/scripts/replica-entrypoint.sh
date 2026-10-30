#!/bin/bash
set -e

export PGDATA="${PGDATA:-/var/lib/postgresql/data}"

# Wait for the primary database to start
until pg_isready -h primary -p 5432 -U appuser; do
  echo "Waiting for primary database..."
  sleep 2
done

# Copy the primary database into the replica's data directory
if [ ! -s "$PGDATA/PG_VERSION" ]; then
  echo "Creating initial replica copy..."

  until PGPASSWORD="$REPLICATION_PASSWORD" \
    pg_basebackup \
      -h primary \
      -p 5432 \
      -U replicator \
      -D "$PGDATA" \
      -Fp -Xs -P -R
  do
    echo "Base backup failed; retrying..."
    sleep 3
  done
fi

exec docker-entrypoint.sh postgres