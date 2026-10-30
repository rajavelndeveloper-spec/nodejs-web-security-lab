# PostgreSQL Database Replication with Docker

## 1. Project Overview

This project demonstrates PostgreSQL physical streaming replication using Docker containers. It covers primary/standby setup, WAL streaming, physical replication slots, replication verification, manual failover, promotion, and rebuilding the old primary as a standby of the promoted server.

**Current lab state:** `pg-replica` is the current primary, and `pg-primary` has been rebuilt and rejoined as its standby.

## 2. Technology Stack

- PostgreSQL 16
- Docker and Docker Compose
- PowerShell
- Physical streaming replication
- Physical replication slots

## 3. Current Architecture

```text
                  Writes
                    |
                    v
             +--------------+
             |  pg-replica  |
             | Current      |
             | Primary      |
             | Host: 5474   |
             +--------------+
                    |
                    | WAL streaming (async)
                    v
             +--------------+
             |  pg-primary  |
             | Standby      |
             | Host: 5473   |
             +--------------+
```

Both PostgreSQL servers run in Docker containers.

| Component | Value |
|---|---|
| Current primary container | `pg-replica` |
| Current standby container | `pg-primary` |
| PostgreSQL image | `postgres:16` |
| Database | `shopdb` |
| Database user | `appuser` |
| Replication user | `replicator` |
| Original replication slot | `replica_slot` |
| Rejoined standby slot | `rejoined_primary_slot` |
| Current primary host port | `5474` |
| Current standby host port | `5473` |
| Replication mode | Physical streaming replication |
| Synchronization mode | Asynchronous |

> **Important:** The service names and host ports reflect the post-failover setup. Do not assume `pg-primary` is still the primary just because of its name.

## 4. Important Concepts

### Primary database
The primary is the writable database server where normal `INSERT`, `UPDATE`, and `DELETE` operations are performed.

### Standby database
The standby receives and replays WAL changes from the primary. During normal standby operation, it accepts read-only queries and rejects ordinary writes.

### WAL (Write-Ahead Log)
WAL records database changes needed for recovery and replication. PostgreSQL streams WAL records rather than replaying each SQL statement on the standby.

### Streaming replication
Streaming replication continuously transfers WAL records from the primary to the standby.

### Physical replication slot
A physical replication slot helps PostgreSQL retain WAL needed by a standby. If a standby is offline, the slot may allow it to catch up after reconnecting. Monitor slots because retained WAL can consume disk space.

### Asynchronous replication
The primary does not wait for the standby to confirm every transaction before reporting a successful commit. A standby can lag, and recent transactions may be lost if the primary fails before those changes reach the standby.

### Failover and promotion
Failover is the process of switching to another server after a primary failure. Promotion changes a standby into a writable primary. PostgreSQL streaming replication alone does not automatically promote a standby.

### Split-brain
Split-brain happens when two database servers both accept writes as independent primaries. After promotion, do not simply restart the old primary with its old writable data directory. Rebuild or safely rewind it to follow the new primary.

## 5. Docker Commands

Run commands from the project directory:

```powershell
cd "D:\Rajavel node advanced practice\nodejs-web-security-lab\src\17_database-replication"
```

Check running containers:

```powershell
docker ps
```

Check all containers:

```powershell
docker ps -a
```

Check Compose configuration:

```powershell
docker compose config
```

Check logs:

```powershell
docker logs --tail 50 pg-replica
docker logs --tail 50 pg-primary
```

## 6. Verify Which Server Is Primary

Check the current primary:

```powershell
docker exec pg-replica psql -U appuser -d shopdb -c "SELECT pg_is_in_recovery();"
```

Expected: `f` (`false`) because `pg-replica` is currently the primary.

Check the standby:

```powershell
docker exec pg-primary psql -U appuser -d shopdb -c "SELECT pg_is_in_recovery();"
```

Expected: `t` (`true`) because `pg-primary` is in standby/recovery mode.

## 7. Verify Streaming Replication

Run this on the current primary:

```powershell
docker exec pg-replica psql -U appuser -d shopdb -c "SELECT application_name, state, sync_state FROM pg_stat_replication;"
```

Our verification showed:

```text
 application_name |   state   | sync_state
------------------+-----------+-----------
 walreceiver      | streaming | async
```

Meaning:
- `state = streaming`: the standby is receiving WAL.
- `sync_state = async`: asynchronous replication is in use.
- `application_name = walreceiver`: the connection reports this application name; it does not mean replication has failed.

## 8. Verify WAL Configuration

Check the WAL level on the current primary:

```powershell
docker exec pg-replica psql -U appuser -d shopdb -c "SHOW wal_level;"
```

Expected: `replica`.

Check the configured maximum replication slots:

```powershell
docker exec pg-replica psql -U appuser -d shopdb -c "SHOW max_replication_slots;"
```

The lab configuration used a capacity of `10` slots.

## 9. Replication Slots

The initial replication slot was named `replica_slot`. During the rejoin exercise, a separate slot named `rejoined_primary_slot` was created on the promoted server for the rebuilt standby.

List slots on the current primary:

```powershell
docker exec pg-replica psql -U appuser -d shopdb -c "SELECT slot_name, slot_type, active, restart_lsn FROM pg_replication_slots;"
```

Check the approximate WAL distance retained for each slot:

```powershell
docker exec pg-replica psql -U appuser -d shopdb -c "SELECT slot_name, active, restart_lsn, pg_size_pretty(pg_wal_lsn_diff(pg_current_wal_lsn(), restart_lsn)) AS wal_distance FROM pg_replication_slots;"
```

The WAL distance is an estimate based on LSN positions; it is not necessarily the exact disk space used by retained WAL files.

## 10. Test Data Replication

Insert a test row into the current primary:

```powershell
docker exec pg-replica psql -U appuser -d shopdb -c "INSERT INTO replication_test (message) VALUES ('Replication after failover');"
```

Read the row from the standby:

```powershell
docker exec pg-primary psql -U appuser -d shopdb -c "SELECT * FROM replication_test ORDER BY id DESC LIMIT 5;"
```

The new row should appear after it has replicated and replayed.

Compare record counts:

```powershell
docker exec pg-replica psql -U appuser -d shopdb -c "SELECT COUNT(*) FROM replication_test;"
docker exec pg-primary psql -U appuser -d shopdb -c "SELECT COUNT(*) FROM replication_test;"
```

Counts should match after the standby catches up, assuming no concurrent writes or replication delay at the moment of checking.

## 11. Confirm the Standby Is Read-Only

Try an insert on the current standby:

```powershell
docker exec pg-primary psql -U appuser -d shopdb -c "INSERT INTO replication_test (message) VALUES ('This should not be written on the standby');"
```

Expected: an error similar to:

```text
ERROR: cannot execute INSERT in a read-only transaction
```

This is expected while `pg-primary` is operating as a standby.

## 12. Manual Failover and Promotion

We practised manual failover by stopping the original primary and promoting the standby.

### Step 1: Stop the old primary

```powershell
docker stop pg-primary
```

### Step 2: Promote the standby

```powershell
docker exec pg-replica psql -U appuser -d shopdb -c "SELECT pg_promote();"
```

### Step 3: Verify promotion

```powershell
docker exec pg-replica psql -U appuser -d shopdb -c "SELECT pg_is_in_recovery();"
```

Expected: `f`, meaning the server is no longer in standby recovery and can act as primary.

### Step 4: Write to the promoted primary

A test insert was performed on `pg-replica` after promotion to verify that the promoted server accepted writes.

> Promotion was manual. Automatic failover has not yet been configured in this project.

## 13. Rebuild and Rejoin the Old Primary as a Standby

After promotion, the original primary must not be restarted with its old writable data directory. That could create split-brain.

For this exercise, we preserved the original primary volume and created a separate volume for the rejoined standby:

- Original volume: `17_database-replication_primary_data`
- Promoted primary volume: `17_database-replication_replica_data`
- New rejoined standby volume: `17_database-replication_rejoined_primary_data`

A backup archive of the original primary data was created and verified before rebuilding the old primary.

### Step 1: Create a slot on the promoted primary

```powershell
docker exec pg-replica psql -U appuser -d shopdb -c "SELECT pg_create_physical_replication_slot('rejoined_primary_slot');"
```

### Step 2: Take a base backup into the new volume

The following command was run from PowerShell:

```powershell
docker run --rm `
  --network 17_database-replication_default `
  -e PGPASSWORD=replica_demo_password `
  -v 17_database-replication_rejoined_primary_data:/var/lib/postgresql/data `
  postgres:16 `
  pg_basebackup `
    -h pg-replica `
    -p 5432 `
    -U replicator `
    -D /var/lib/postgresql/data `
    -Fp `
    -Xs `
    -P `
    -R `
    -S rejoined_primary_slot
```

The backup completed at 100%.

Important options:
- `-Fp`: plain directory format.
- `-Xs`: stream required WAL during the backup.
- `-P`: display progress.
- `-R`: write standby connection configuration and create `standby.signal`.
- `-S rejoined_primary_slot`: use the dedicated physical replication slot.

### Step 3: Verify standby files

```powershell
docker run --rm `
  -v 17_database-replication_rejoined_primary_data:/data:ro `
  alpine `
  sh -c "ls -l /data/PG_VERSION /data/standby.signal"
```

Both files were present.

### Step 4: Correct data-file ownership

The base backup was initially created by a root-run helper container, so file ownership was corrected on the new volume:

```powershell
docker run --rm `
  -u 0 `
  -v 17_database-replication_rejoined_primary_data:/data `
  postgres:16 `
  chown -R postgres:postgres /data
```

This command was restricted to the new rejoined standby volume; it did not modify the original primary volume.

### Step 5: Configure and start the rejoined standby

The Compose configuration was updated so `pg-primary` uses the new volume and a dedicated startup script. The script checks that `standby.signal` exists before starting PostgreSQL.

Start only the primary service without starting dependencies:

```powershell
docker compose up -d --no-deps primary
```

Check its logs:

```powershell
docker logs --tail 50 pg-primary
```

The successful logs included:

```text
entering standby mode
database system is ready to accept read-only connections
started streaming WAL from primary at 0/5000000 on timeline 2
```

These messages confirmed that the old primary had started in standby mode and was streaming WAL from the promoted primary.

## 14. Final Verification After Rejoin

### Verify the rejoined standby

```powershell
docker exec pg-primary psql -U appuser -d shopdb -c "SELECT pg_is_in_recovery();"
```

Observed result:

```text
 pg_is_in_recovery
-------------------
 t
```

### Verify the promoted primary sees a streaming standby

```powershell
docker exec pg-replica psql -U appuser -d shopdb -c "SELECT application_name, state, sync_state FROM pg_stat_replication;"
```

Observed result:

```text
 application_name |   state   | sync_state
------------------+-----------+-----------
 walreceiver      | streaming | async
```

**Result:** Both checks passed. `pg-replica` is the current primary, and `pg-primary` is its streaming standby.

## 15. Useful Verification Commands

### Check recovery state

```powershell
docker exec pg-replica psql -U appuser -d shopdb -c "SELECT pg_is_in_recovery();"
docker exec pg-primary psql -U appuser -d shopdb -c "SELECT pg_is_in_recovery();"
```

Expected in the current topology:
- `pg-replica`: `f`
- `pg-primary`: `t`

### Check replication status

```powershell
docker exec pg-replica psql -U appuser -d shopdb -c "SELECT application_name, state, sync_state FROM pg_stat_replication;"
```

### Compare record counts

```powershell
docker exec pg-replica psql -U appuser -d shopdb -c "SELECT COUNT(*) FROM replication_test;"
docker exec pg-primary psql -U appuser -d shopdb -c "SELECT COUNT(*) FROM replication_test;"
```

### Check standby WAL replay position

```powershell
docker exec pg-primary psql -U appuser -d shopdb -c "SELECT pg_last_wal_replay_lsn();"
```

## 16. What We Have Completed

- [x] Created primary and standby PostgreSQL containers with Docker Compose.
- [x] Configured physical streaming replication.
- [x] Learned about WAL and asynchronous replication.
- [x] Created and checked physical replication slots.
- [x] Verified primary inserts appeared on the standby.
- [x] Confirmed that the standby rejects normal writes.
- [x] Tested replication after a container restart.
- [x] Tested the standby going offline and catching up after reconnecting.
- [x] Checked WAL retention information.
- [x] Inserted 100 test records and compared database counts.
- [x] Stopped the original primary and manually promoted the standby.
- [x] Preserved the original primary volume and verified a backup archive.
- [x] Rebuilt the old primary using `pg_basebackup` into a new volume.
- [x] Rejoined the old primary as a standby of the promoted primary.
- [x] Verified `pg_is_in_recovery() = t` on the standby.
- [x] Verified `state = streaming` and `sync_state = async` on the new primary.

## 17. Next Learning Steps

The next planned topic is **automatic failover**. It is not configured yet.

Planned topics:
1. Understand health checks and leader election.
2. Learn Patroni for PostgreSQL high availability.
3. Learn etcd as a distributed consensus system.
4. Create a separate Docker Compose lab for Patroni, etcd, and PostgreSQL.
5. Stop the active primary and observe automatic promotion.
6. Verify which node becomes primary and test client reconnection.
7. Learn about failover safety, split-brain prevention, and replication lag.

Other useful topics:
- Measuring replication lag using WAL positions.
- Monitoring inactive replication slots and retained WAL.
- Understanding the difference between replication and backup.
- Learning how synchronous replication changes durability and availability trade-offs.

## 18. Important Safety Notes

- Streaming replication alone does not provide automatic failover.
- Asynchronous replication can lose recent transactions if a primary fails before the standby receives them.
- Do not start the old primary as a writable server after promoting a standby.
- Keep the original primary volume and verified backup until the rebuilt standby has been validated.
- Monitor replication slots and disk space.
- Use strong credentials and avoid committing real database passwords to source control.
- The Compose configuration and scripts in this lab are for learning; review security and high-availability requirements before production use.

## Conclusion

This lab began with PostgreSQL physical streaming replication and progressed through replication-slot management, failure testing, manual promotion, and rejoining the old primary as a standby. The final checks confirmed that `pg-replica` is the current primary and `pg-primary` is streaming from it.

The next phase is to build a separate automatic-failover lab using Patroni and etcd.
