# Database Operations

This guide covers database backup, restoration, maintenance, and troubleshooting for the Activity Challenge Bot.

## Database Overview

The bot uses PostgreSQL with three main tables:

- **users**: Participant information and total points
- **activities**: Logged activities and points per activity
- **feedback**: User feedback submissions

See the [Database Architecture](/architecture/database) for detailed schema information.

## Connection Information

### Environment Variables

```env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password
POSTGRES_DB=activity_challenge_bot
POSTGRES_HOST=localhost        # or 'postgres' for containers
POSTGRES_PORT=5432
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/activity_challenge_bot
```

### Direct Connection

```bash
# Local PostgreSQL
psql -U postgres -h localhost -d activity_challenge_bot

# Container (from host)
psql postgresql://postgres:password@localhost:5432/activity_challenge_bot

# Container (from inside bot container)
psql postgresql://postgres:password@postgres:5432/activity_challenge_bot
```

## Backup Operations

### Manual Backup

**Full database backup:**

```bash
# Create backup directory
mkdir -p backups

# Backup entire database
pg_dump -U postgres -h localhost activity_challenge_bot > backups/backup-$(date +%Y%m%d-%H%M%S).sql

# Backup with compression
pg_dump -U postgres -h localhost activity_challenge_bot | gzip > backups/backup-$(date +%Y%m%d-%H%M%S).sql.gz
```

**Table-specific backup:**

```bash
# Backup only activities table
pg_dump -U postgres -h localhost -t activities activity_challenge_bot > backups/activities-$(date +%Y%m%d).sql

# Backup only users table
pg_dump -U postgres -h localhost -t users activity_challenge_bot > backups/users-$(date +%Y%m%d).sql
```

**Custom format (faster restore, compression):**

```bash
# Create custom format backup
pg_dump -U postgres -h localhost -Fc activity_challenge_bot > backups/backup-$(date +%Y%m%d).dump

# This format allows:
# - Faster restoration
# - Selective table restoration
# - Built-in compression
```

### Container Backups

**From Docker/Podman:**

```bash
# Backup from running container
docker exec postgres pg_dump -U postgres activity_challenge_bot > backups/backup-$(date +%Y%m%d).sql

# Or with podman
podman exec postgres pg_dump -U postgres activity_challenge_bot > backups/backup-$(date +%Y%m%d).sql
```

### Automated Backup Script

Create `scripts/backup-db.sh`:

```bash
#!/bin/bash
set -e

BACKUP_DIR="backups"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup-$TIMESTAMP.sql.gz"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Perform backup
pg_dump -U postgres -h localhost activity_challenge_bot | gzip > "$BACKUP_FILE"

# Keep only last 30 days of backups
find "$BACKUP_DIR" -name "backup-*.sql.gz" -mtime +30 -delete

echo "✅ Backup completed: $BACKUP_FILE"
```

Make it executable:

```bash
chmod +x scripts/backup-db.sh
```

**Schedule with cron:**

```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * /path/to/project/scripts/backup-db.sh
```

## Restoration Operations

### Full Database Restore

::: danger Data Loss Warning
Restoring will **DELETE ALL EXISTING DATA**. Always backup current data first!
:::

**From SQL backup:**

```bash
# Drop and recreate database
psql -U postgres -h localhost -c "DROP DATABASE IF EXISTS activity_challenge_bot;"
psql -U postgres -h localhost -c "CREATE DATABASE activity_challenge_bot;"

# Restore backup
psql -U postgres -h localhost activity_challenge_bot < backups/backup-20260106.sql
```

**From compressed backup:**

```bash
# Restore from gzip
gunzip -c backups/backup-20260106.sql.gz | psql -U postgres -h localhost activity_challenge_bot
```

**From custom format:**

```bash
# Drop and recreate
psql -U postgres -h localhost -c "DROP DATABASE IF EXISTS activity_challenge_bot;"
psql -U postgres -h localhost -c "CREATE DATABASE activity_challenge_bot;"

# Restore using pg_restore
pg_restore -U postgres -h localhost -d activity_challenge_bot backups/backup-20260106.dump
```

### Partial Restore

**Restore specific table:**

```bash
# Extract table from backup
pg_restore -U postgres -h localhost -d activity_challenge_bot -t activities backups/backup.dump
```

**Restore to different database for testing:**

```bash
# Create test database
psql -U postgres -h localhost -c "CREATE DATABASE activity_challenge_bot_test;"

# Restore to test database
psql -U postgres -h localhost activity_challenge_bot_test < backups/backup.sql
```

## Database Migrations

### Running Migrations

Migrations are stored in `src/db/schema.sql` and run automatically on startup.

**Manual migration:**

```bash
# Run migration script
bun run src/db/migrate.ts
```

**What migrations do:**
1. Set PostgreSQL message level to WARNING (suppress notices)
2. Execute all SQL in `schema.sql`
3. Create tables if they don't exist
4. Create indexes if they don't exist
5. Reset message level to NOTICE

::: tip Idempotent Migrations
The migration uses `IF NOT EXISTS` clauses, so it's safe to run multiple times. Existing data won't be affected.
:::

### Adding New Migrations

If you need to modify the schema:

1. **Update `src/db/schema.sql`:**

```sql
-- Add new column
ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- Add new index
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
```

2. **Test locally:**

```bash
bun run src/db/migrate.ts
```

3. **Deploy:**

The migration runs automatically when the bot starts.

## Maintenance Operations

### Vacuum and Analyze

Regular maintenance to optimize performance:

```bash
# Analyze all tables (updates statistics)
psql -U postgres -h localhost activity_challenge_bot -c "ANALYZE;"

# Vacuum and analyze
psql -U postgres -h localhost activity_challenge_bot -c "VACUUM ANALYZE;"

# Full vacuum (requires more locks, do during downtime)
psql -U postgres -h localhost activity_challenge_bot -c "VACUUM FULL ANALYZE;"
```

**Schedule weekly vacuum:**

```bash
# Add to crontab
0 3 * * 0 psql -U postgres -h localhost activity_challenge_bot -c "VACUUM ANALYZE;"
```

### Reindex

Rebuild indexes for better performance:

```bash
# Reindex specific table
psql -U postgres -h localhost activity_challenge_bot -c "REINDEX TABLE activities;"

# Reindex entire database (requires downtime)
psql -U postgres -h localhost activity_challenge_bot -c "REINDEX DATABASE activity_challenge_bot;"
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

-- Index sizes
SELECT 
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) as size
FROM pg_stat_user_indexes
ORDER BY pg_relation_size(indexrelid) DESC;
```

### Check Index Usage

```sql
-- Find unused indexes
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan as index_scans
FROM pg_stat_user_indexes
WHERE idx_scan = 0
AND indexname NOT LIKE '%_pkey';

-- Index usage statistics
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan as scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
```

## Data Management

### Export Data for Analysis

**Export to CSV:**

```bash
# Export activities
psql -U postgres -h localhost activity_challenge_bot \
  -c "COPY (SELECT * FROM activities) TO STDOUT WITH CSV HEADER" \
  > exports/activities-$(date +%Y%m%d).csv

# Export user statistics
psql -U postgres -h localhost activity_challenge_bot \
  -c "COPY (SELECT username, guild, points, created_at FROM users) TO STDOUT WITH CSV HEADER" \
  > exports/users-$(date +%Y%m%d).csv
```

**Export guild statistics:**

```bash
psql -U postgres -h localhost activity_challenge_bot \
  -c "COPY (
    SELECT 
      u.guild,
      COUNT(*) as registered_users,
      SUM(u.points) as total_points,
      AVG(u.points) as avg_points
    FROM users u
    WHERE u.guild IS NOT NULL
    GROUP BY u.guild
  ) TO STDOUT WITH CSV HEADER" \
  > exports/guild-stats-$(date +%Y%m%d).csv
```

### Import Data

**Import from CSV:**

```bash
# Import activities (be careful with IDs!)
psql -U postgres -h localhost activity_challenge_bot \
  -c "\COPY activities(user_id, activity_type, duration, points, activity_date) FROM 'imports/activities.csv' CSV HEADER"
```

::: warning Import Constraints
- Ensure foreign keys exist (user_id must exist in users table)
- Watch for duplicate unique constraints
- Consider resetting sequences after import
:::

### Clean Old Data

**Archive old competition data:**

```sql
-- Create archive table
CREATE TABLE activities_archive_2025 AS 
SELECT * FROM activities 
WHERE activity_date < '2025-12-24';

-- Verify archive
SELECT COUNT(*) FROM activities_archive_2025;

-- Delete archived data (optional)
DELETE FROM activities 
WHERE activity_date < '2025-12-24';

-- Vacuum to reclaim space
VACUUM FULL activities;
```

**Delete test users:**

```sql
-- Find test users
SELECT * FROM users 
WHERE username LIKE 'test%' 
   OR first_name LIKE 'Test%';

-- Delete test users (cascade deletes activities)
DELETE FROM users 
WHERE username LIKE 'test%';
```

## Performance Monitoring

### Query Performance

**Slow query log:**

```sql
-- Enable slow query logging (in postgresql.conf)
-- log_min_duration_statement = 1000  (log queries > 1 second)

-- View slow queries
SELECT 
  query,
  calls,
  total_exec_time,
  mean_exec_time,
  max_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

**Table statistics:**

```sql
-- Table scan statistics
SELECT 
  schemaname,
  tablename,
  seq_scan,      -- Sequential scans (bad if high)
  seq_tup_read,
  idx_scan,      -- Index scans (good)
  idx_tup_fetch
FROM pg_stat_user_tables
ORDER BY seq_scan DESC;

-- Cache hit ratio (should be > 99%)
SELECT 
  sum(heap_blks_read) as heap_read,
  sum(heap_blks_hit) as heap_hit,
  sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read)) as ratio
FROM pg_statio_user_tables;
```

### Connection Monitoring

```sql
-- Current connections
SELECT 
  datname,
  usename,
  application_name,
  client_addr,
  state,
  query_start,
  state_change
FROM pg_stat_activity
WHERE datname = 'activity_challenge_bot';

-- Connection limits
SELECT 
  max_conn,
  used,
  res_for_super,
  max_conn - used - res_for_super as available
FROM (
  SELECT count(*) used FROM pg_stat_activity
) t1,
(
  SELECT setting::int res_for_super FROM pg_settings WHERE name='superuser_reserved_connections'
) t2,
(
  SELECT setting::int max_conn FROM pg_settings WHERE name='max_connections'
) t3;
```

## Troubleshooting

### Connection Refused

**Problem:** `ECONNREFUSED` or `could not connect to server`

**Solutions:**

1. **Check PostgreSQL is running:**
```bash
# Local
pg_isready -h localhost -p 5432

# Container
docker ps | grep postgres
```

2. **Check connection settings:**
```bash
# Test connection
psql postgresql://postgres:password@localhost:5432/activity_challenge_bot

# Check environment
echo $DATABASE_URL
```

3. **Check PostgreSQL logs:**
```bash
# Container logs
docker logs postgres

# Local logs (varies by OS)
tail -f /var/log/postgresql/postgresql-*.log
```

### Too Many Connections

**Problem:** `FATAL: sorry, too many clients already`

**Solutions:**

1. **Check current connections:**
```sql
SELECT count(*) FROM pg_stat_activity;
```

2. **Kill idle connections:**
```sql
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = 'activity_challenge_bot'
  AND state = 'idle'
  AND state_change < NOW() - INTERVAL '5 minutes';
```

3. **Increase max_connections** (postgresql.conf):
```
max_connections = 100  # Increase if needed
```

### Disk Space Issues

**Problem:** Database running out of disk space

**Solutions:**

1. **Check disk usage:**
```bash
df -h /var/lib/postgresql/data
```

2. **Find large tables:**
```sql
SELECT 
  table_name,
  pg_size_pretty(pg_total_relation_size(table_name::regclass))
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY pg_total_relation_size(table_name::regclass) DESC;
```

3. **Archive old data** (see Data Management section)

4. **Vacuum to reclaim space:**
```sql
VACUUM FULL ANALYZE;
```

### Slow Queries

**Problem:** Bot is slow, database queries taking too long

**Diagnosis:**

```sql
-- Currently running queries
SELECT 
  pid,
  now() - query_start as duration,
  query
FROM pg_stat_activity
WHERE state = 'active'
  AND datname = 'activity_challenge_bot'
ORDER BY duration DESC;

-- Table scans (should use indexes)
SELECT * FROM pg_stat_user_tables
WHERE seq_scan > 1000
ORDER BY seq_scan DESC;
```

**Solutions:**

1. **Add missing indexes** (check schema.sql)
2. **Run ANALYZE:**
```sql
ANALYZE users;
ANALYZE activities;
ANALYZE feedback;
```

3. **Reindex if needed:**
```sql
REINDEX TABLE activities;
```

### Corrupt Indexes

**Problem:** Index corruption after crash or disk issue

**Solution:**

```sql
-- Reindex all tables
REINDEX TABLE users;
REINDEX TABLE activities;
REINDEX TABLE feedback;

-- Or entire database (requires downtime)
REINDEX DATABASE activity_challenge_bot;
```

## Security Best Practices

### Database User Permissions

Create a limited user for the bot (instead of using postgres superuser):

```sql
-- Create bot user
CREATE USER bot_user WITH PASSWORD 'secure_password';

-- Grant necessary permissions
GRANT CONNECT ON DATABASE activity_challenge_bot TO bot_user;
GRANT USAGE ON SCHEMA public TO bot_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO bot_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO bot_user;

-- Make grants default for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public 
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO bot_user;
```

Update `.env`:
```env
POSTGRES_USER=bot_user
POSTGRES_PASSWORD=secure_password
DATABASE_URL=postgresql://bot_user:secure_password@localhost:5432/activity_challenge_bot
```

### Password Security

- ✅ Use strong, randomly generated passwords
- ✅ Different passwords for dev/prod
- ✅ Never commit passwords to git
- ✅ Rotate passwords periodically
- ✅ Use environment variables or secrets management

### Connection Security

**For production:**

```env
# Use SSL connections
DATABASE_URL=postgresql://user:pass@host:5432/dbname?sslmode=require

# Or disable SSL for local dev only
DATABASE_URL=postgresql://user:pass@localhost:5432/dbname?sslmode=disable
```

### Backup Security

- ✅ Encrypt backups at rest
- ✅ Store backups in secure location
- ✅ Limit access to backup files
- ✅ Test backup restoration regularly

## Best Practices

✅ **Regular backups:** Daily automated backups, keep 30 days
✅ **Test restores:** Verify backups work before you need them
✅ **Monitor size:** Watch database growth, plan for scaling
✅ **Vacuum regularly:** Weekly ANALYZE, monthly VACUUM FULL
✅ **Index monitoring:** Check index usage, remove unused indexes
✅ **Security:** Use limited permissions, strong passwords
✅ **Documentation:** Keep notes on schema changes
✅ **Staging environment:** Test migrations before production

## Next Steps

- Set up [Monitoring](/admin/monitoring) for database health
- Review [Competition Setup](/admin/competition-setup)
- Learn about [Guild Management](/admin/guild-management)
- Check [Architecture: Database](/architecture/database) for schema details