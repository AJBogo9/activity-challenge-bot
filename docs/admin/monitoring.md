# Monitoring and Troubleshooting

This guide covers monitoring the Activity Challenge Bot's health and troubleshooting common issues.

## Log Monitoring

### Bot Log Patterns

The bot uses emoji indicators for quick log scanning:

```
✅ Database migrations completed
🤖 Bot started successfully
❌ Bot error: [error details]
⚠️  Invalid activity data
```

### Viewing Logs

```bash
# Local development
bun run dev  # Logs appear in terminal

# Container
bun run pod:logs

# Kubernetes
kubectl logs -f deployment/activity-challenge-bot
```

### Critical Log Patterns

**Successful startup:**
```
✅ Database migrations completed
🤖 Bot started successfully!
```

**Database issues:**
```
❌ Database connection failed
❌ Migration failed: connection refused
```

**Telegram API issues:**
```
❌ Bot error: 429 Too Many Requests
❌ Bot error: 401 Unauthorized
```

## Health Checks

### Quick Health Check Script

Create `scripts/health-check.ts`:

```typescript
import { bot } from '../src/bot/instance'

async function healthCheck() {
  try {
    const me = await bot.telegram.getMe()
    console.log('✅ Bot is healthy:', me.username)
    process.exit(0)
  } catch (error) {
    console.error('❌ Bot health check failed:', error)
    process.exit(1)
  }
}

healthCheck()
```

Run: `bun run scripts/health-check.ts`

### Database Health

```bash
# Quick connection test
psql $DATABASE_URL -c "SELECT 1"

# Check recent activity
psql $DATABASE_URL -c "SELECT MAX(created_at) FROM activities"
```

## User Activity Monitoring

### Active Users

```sql
-- Users active today
SELECT COUNT(DISTINCT user_id) 
FROM activities 
WHERE activity_date = CURRENT_DATE;

-- Most active users this week
SELECT u.username, COUNT(a.id) as activities
FROM activities a
JOIN users u ON u.id = a.user_id
WHERE a.activity_date >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY u.username
ORDER BY activities DESC
LIMIT 10;
```

### Activity Patterns

```sql
-- Activities per day (last 7 days)
SELECT 
  activity_date,
  COUNT(*) as activity_count,
  COUNT(DISTINCT user_id) as unique_users
FROM activities
WHERE activity_date >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY activity_date
ORDER BY activity_date DESC;

-- Popular activity types this month
SELECT 
  activity_type,
  COUNT(*) as count,
  SUM(points) as total_points
FROM activities
WHERE activity_date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY activity_type
ORDER BY count DESC
LIMIT 20;
```

### Registration Trends

```sql
-- Registrations by guild
SELECT 
  guild,
  COUNT(*) as registrations,
  MAX(created_at) as last_registration
FROM users
GROUP BY guild
ORDER BY registrations DESC;
```

## Troubleshooting Guide

### Bot Not Responding

**Quick diagnostics:**
```bash
# 1. Check if bot is running
ps aux | grep bun

# 2. Check recent logs
tail -n 50 logs/bot.log

# 3. Test database
psql $DATABASE_URL -c "SELECT 1"

# 4. Test bot health
bun run scripts/health-check.ts
```

**Common fixes:**
```bash
# Restart bot
bun run dev  # or docker restart activity-challenge-bot

# Check bot token
echo $BOT_TOKEN

# Restart database
docker restart postgres
```

### Slow Performance

**Diagnose:**
```sql
-- Check for slow queries
SELECT query, calls, mean_exec_time
FROM pg_stat_statements
WHERE query LIKE '%activities%'
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Check for missing index usage
SELECT * FROM pg_stat_user_tables 
WHERE schemaname = 'public' AND seq_scan > 1000;
```

**Fix:**
```sql
-- Update statistics
ANALYZE users;
ANALYZE activities;

-- Close idle connections
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE state = 'idle' AND state_change < NOW() - INTERVAL '10 minutes';
```

### Users Can't Register

**Check:**
```bash
# Verify guild configuration
cat src/config/guilds.ts

# Check database access
psql $DATABASE_URL -c "SELECT COUNT(*) FROM users"
```

**Fix:**
- Ensure guilds have `isActive: true` in config
- Verify database is accessible
- Check logs for specific error messages

### Points Not Updating

**Diagnose:**
```sql
-- Check if activities are being saved
SELECT * FROM activities 
WHERE user_id = (SELECT id FROM users WHERE telegram_id = '123456789')
ORDER BY created_at DESC 
LIMIT 5;

-- Verify user points
SELECT * FROM users WHERE telegram_id = '123456789';
```

**Common causes:**
- Database connection lost
- Activity hierarchy data corrupted
- Competition period validation failing

## Performance Monitoring

### Cache Statistics

Check guild leaderboard cache effectiveness:

```typescript
// Add logging to src/db/guilds.ts
console.log('Cache hit:', lastCacheUpdate !== null)
console.log('Cache age:', Date.now() - lastCacheUpdate?.getTime())
```

### Resource Usage

```bash
# Container resource usage
docker stats activity-challenge-bot

# Kubernetes
kubectl top pod activity-challenge-bot-xxxxx
```

## Alerting

### Simple Alert Script

Create `scripts/alert.sh`:

```bash
#!/bin/bash

EMAIL="admin@example.com"

# Check if bot is running
if ! pgrep -f "bun run" > /dev/null; then
    echo "Bot is not running!" | mail -s "Bot Alert" "$EMAIL"
fi

# Check database
if ! psql $DATABASE_URL -c "SELECT 1" > /dev/null 2>&1; then
    echo "Database connection failed!" | mail -s "Bot Alert" "$EMAIL"
fi

# Check disk space
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 90 ]; then
    echo "Disk usage at ${DISK_USAGE}%!" | mail -s "Bot Alert" "$EMAIL"
fi
```

Schedule: `*/15 * * * * /path/to/scripts/alert.sh`

### Production Monitoring

For production deployments, consider:
- **Uptime monitoring**: [UptimeRobot](https://uptimerobot.com/), [Pingdom](https://www.pingdom.com/)
- **Log aggregation**: [Grafana Loki](https://grafana.com/oss/loki/)
- **Metrics**: [Prometheus](https://prometheus.io/) + [Grafana](https://grafana.com/)
- **Error tracking**: [Sentry](https://sentry.io/)

## Maintenance Schedule

**Daily:**
- ✅ Check bot is running
- ✅ Review error logs

**Weekly:**
- ✅ Check database size growth
- ✅ Analyze user activity trends
- ✅ Run VACUUM ANALYZE

**Monthly:**
- ✅ Review and rotate logs
- ✅ Verify backup restores work
- ✅ Update dependencies

**Quarterly:**
- ✅ Archive old competition data
- ✅ Review and optimize indexes
- ✅ Security audit

## Best Practices

✅ **Automate monitoring** with scripts and cron jobs  
✅ **Set up alerts** for critical issues  
✅ **Regular backups** (see [Database Operations](/admin/database-operations))  
✅ **Monitor trends** to spot issues early  
✅ **Document incidents** for future reference  

## Next Steps

- [Database Operations](/admin/database-operations) - Backup and maintenance
- [Competition Setup](/admin/competition-setup) - Configure competitions
- [Architecture Overview](/architecture/overview) - Understand the system