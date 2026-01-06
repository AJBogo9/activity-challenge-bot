# Database Operations

This guide covers database backup, restoration, and maintenance specific to the Activity Challenge Bot.

## Database Overview

The bot uses PostgreSQL with three main tables:
- **users**: Participant information and total points
- **activities**: Logged activities and points per activity
- **feedback**: User feedback submissions

See [Database Architecture](/architecture/database) for detailed schema.

## Connection Information

```dotenv
DATABASE_URL=postgresql://postgres:password@localhost:5432/activity_challenge_bot
```

**Direct connection:**
```bash
# Local
psql $DATABASE_URL

# Container
bun run pod:db:psql
```

## Backup Operations

### Quick Backup Script

Create `scripts/backup-db.sh`:

```bash
#!/bin/bash
set -e

BACKUP_DIR="backups"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup-$TIMESTAMP.sql.gz"

mkdir -p "$BACKUP_DIR"
pg_dump $DATABASE_URL | gzip > "$BACKUP_FILE"

# Keep only last 30 days
find "$BACKUP_DIR" -name "backup-*.sql.gz" -mtime +30 -delete

echo "✅ Backup completed: $BACKUP_FILE"
```

Make executable: `chmod +x scripts/backup-db.sh`

**Automate with cron:**
```bash
# Daily backup at 2 AM
0 2 * * * /path/to/project/scripts/backup-db.sh
```

### Container Backups

```bash
# Backup from running container
docker exec postgres pg_dump -U postgres activity_challenge_bot | gzip > backups/backup-$(date +%Y%m%d).sql.gz
```

## Restoration

### Full Database Restore

**⚠️ Warning: This deletes all existing data!**

```bash
# Drop and recreate
psql $DATABASE_URL -c "DROP DATABASE IF EXISTS activity_challenge_bot;"
psql $DATABASE_URL -c "CREATE DATABASE activity_challenge_bot;"

# Restore
gunzip -c backups/backup-20260106.sql.gz | psql $DATABASE_URL
```

### Test Restore (Non-destructive)

```bash
# Create test database
psql $DATABASE_URL -c "CREATE DATABASE activity_challenge_bot_test;"

# Restore to test
psql postgresql://postgres:password@localhost:5432/activity_challenge_bot_test < backups/backup.sql
```

## Common Database Tasks

### Export Data for Analysis

**Activities CSV:**
```bash
psql $DATABASE_URL -c "COPY (SELECT * FROM activities) TO STDOUT WITH CSV HEADER" > exports/activities-$(date +%Y%m%d).csv
```

**Guild Statistics:**
```bash
psql $DATABASE_URL -c "COPY (
  SELECT 
    u.guild,
    COUNT(*) as registered_users,
    SUM(u.points) as total_points,
    AVG(u.points) as avg_points
  FROM users u
  WHERE u.guild IS NOT NULL
  GROUP BY u.guild
) TO STDOUT WITH CSV HEADER" > exports/guild-stats-$(date +%Y%m%d).csv
```

### Archive Old Competition Data

```sql
-- Create archive table
CREATE TABLE activities_archive_2025 AS 
SELECT * FROM activities 
WHERE activity_date < '2025-12-24';

-- Verify archive
SELECT COUNT(*) FROM activities_archive_2025;

-- Delete archived data (optional)
DELETE FROM activities WHERE activity_date < '2025-12-24';
VACUUM FULL activities;
```

### Clean Test Data

```sql
-- Find test users
SELECT * FROM users WHERE username LIKE 'test%';

-- Delete test users (cascade deletes activities)
DELETE FROM users WHERE username LIKE 'test%';
```

## Maintenance

### Weekly Maintenance

Add to crontab:
```bash
# Every Sunday at 3 AM
0 3 * * 0 psql $DATABASE_URL -c "VACUUM ANALYZE;"
```

### Check Database Size

```sql
-- Database size
SELECT pg_size_pretty(pg_database_size('activity_challenge_bot'));

-- Table sizes
SELECT 
  table_name,
  pg_size_pretty(pg_total_relation_size(table_name::regclass)) as size
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY pg_total_relation_size(table_name::regclass) DESC;
```

## Troubleshooting

### Connection Issues

**Problem:** `ECONNREFUSED` or connection errors

**Check:**
```bash
# Is PostgreSQL running?
docker ps | grep postgres

# Test connection
psql $DATABASE_URL -c "SELECT 1"
```

**Fix:**
```bash
# Restart PostgreSQL container
docker restart postgres
```

### Slow Queries

**Diagnose:**
```sql
-- Currently running queries
SELECT pid, now() - query_start as duration, query
FROM pg_stat_activity
WHERE state = 'active' AND datname = 'activity_challenge_bot'
ORDER BY duration DESC;
```

**Fix:**
```sql
-- Update statistics
ANALYZE users;
ANALYZE activities;

-- Reindex if needed
REINDEX TABLE activities;
```

### Disk Space Issues

**Check:**
```bash
df -h /var/lib/postgresql/data
```

**Solutions:**
1. Archive old competition data (see above)
2. Run `VACUUM FULL ANALYZE;` to reclaim space
3. Remove old backups: `find backups/ -name "*.sql.gz" -mtime +90 -delete`

## Data Verification

### Check Points Consistency

```sql
-- Verify user points match activity sums
SELECT 
  u.id,
  u.points as user_points,
  COALESCE(SUM(a.points), 0) as calculated_points,
  u.points - COALESCE(SUM(a.points), 0) as difference
FROM users u
LEFT JOIN activities a ON u.id = a.user_id
GROUP BY u.id, u.points
HAVING ABS(u.points - COALESCE(SUM(a.points), 0)) > 0.01;
```

### Find Activities Outside Competition

```sql
-- Activities with dates outside current competition
SELECT u.username, a.activity_type, a.activity_date, a.points
FROM activities a
JOIN users u ON u.id = a.user_id
WHERE a.activity_date < '2025-12-24'  -- Before competition
   OR a.activity_date > '2026-03-31'  -- After competition
ORDER BY a.activity_date DESC;
```

## Security

### Limited User Permissions

Instead of using the postgres superuser, create a limited bot user:

```sql
-- Create bot user
CREATE USER bot_user WITH PASSWORD 'secure_password';

-- Grant necessary permissions
GRANT CONNECT ON DATABASE activity_challenge_bot TO bot_user;
GRANT USAGE ON SCHEMA public TO bot_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO bot_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO bot_user;
```

Update `.env`:
```dotenv
DATABASE_URL=postgresql://bot_user:secure_password@localhost:5432/activity_challenge_bot
```

### Backup Security

- ✅ Store backups in secure location (not in git repo)
- ✅ Encrypt backups at rest if storing remotely
- ✅ Use strong passwords (different for dev/prod)
- ✅ Test backup restoration regularly

## Best Practices

✅ **Daily automated backups** with 30-day retention  
✅ **Test restores monthly** to verify backups work  
✅ **Weekly VACUUM ANALYZE** for performance  
✅ **Monitor database size** and plan for growth  
✅ **Use limited permissions** for the bot user  
✅ **Archive old competitions** to keep database lean  

## Further Reading

- [PostgreSQL Backup Documentation](https://www.postgresql.org/docs/current/backup.html)
- [PostgreSQL Maintenance](https://www.postgresql.org/docs/current/maintenance.html)
- [Competition Setup](/admin/competition-setup)
- [Monitoring](/admin/monitoring)