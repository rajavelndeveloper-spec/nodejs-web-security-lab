
#!/bin/bash
set -e

export PGDATA="${PGDATA:-/var/lib/postgresql/data}"

echo "PGDATA is: $PGDATA"
echo "Checking standby files..."

ls -ld "$PGDATA"
ls -l "$PGDATA/PG_VERSION" || true
ls -l "$PGDATA/standby.signal" || true

until pg_isready -h replica -p 5432 -U appuser; do
  echo "Waiting for promoted primary..."
  sleep 2
done

if [ ! -f "$PGDATA/standby.signal" ]; then
  echo "ERROR: standby.signal not found at $PGDATA"
  exit 1
fi

exec docker-entrypoint.sh postgres
