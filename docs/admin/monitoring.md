# Monitoring and Troubleshooting

This guide covers monitoring the Activity Challenge Bot's health, performance, and troubleshooting common issues.

## Monitoring Overview

The bot includes built-in logging and error handling. Monitoring focuses on:

- Bot availability and responsiveness
- Database connectivity and performance
- Error rates and types
- User activity patterns
- Resource usage

## Log Monitoring

### Application Logs

The bot uses console logging with emoji indicators:

```
✅ Success/completion messages
❌ Errors and failures
🔄 In-progress operations
🤖 Bot lifecycle events
⚠️  Warnings
📊 Statistics
```

### Viewing Logs

**Local development:**
```bash
# Run bot with output
bun run dev

# Run in background and save logs
bun run dev > logs/bot-$(date +%Y%m%d).log 2>&1 &
```

**Container (Docker/Podman):**
```bash
# View live logs
docker logs -f activity-challenge-bot

# View last 100 lines
docker logs --tail 100 activity-challenge-bot

# Follow logs with timestamps
docker logs -f --timestamps activity-challenge-bot
```

**Kubernetes:**
```bash
# View pod logs
kubectl logs -f deployment/activity-challenge-bot

# View logs from specific pod
kubectl logs -f activity-challenge-bot-xxxxx

# View previous crashed pod logs
kubectl logs -f activity-challenge-bot-xxxxx --previous
```

### Log Patterns to Monitor

**Successful startup:**
```
✅ Database migrations completed
🤖 Bot started successfully
```

**Database connection issues:**
```
❌ Database connection failed
❌ Migration failed: connection refused
```

**Telegram API errors:**
```
❌ Bot error: 429 Too Many Requests
❌ Bot error: 401 Unauthorized
```

**User errors:**
```
⚠️  Invalid activity data
❌ Failed to save activity
```

## Error Monitoring

### Error Handler

The bot has a global error handler in `src/bot/middleware.ts`:

```typescript
bot.catch((err, ctx) => {
  console.error('❌ Bot error:', err)
  console.error('Context:', {
    updateType: ctx.updateType,
    chatId: ctx.chat?.id,
    userId: ctx.from?.id,
  })
})
```

### Common Error Types

#### Telegram API Errors

**429 Too Many Requests:**
```
❌ Bot error: TelegramError: 429: Too Many Requests: retry after 30
```

**Cause:** Bot is sending too many messages too quickly

**Solution:** Telegram rate limits (30 messages/second to different users, 1 message/second to same user)

**Prevention:** Implement message queuing if sending bulk messages

**400 Bad Request:**
```
❌ Bot error: TelegramError: 400: Bad Request: message text is empty
```

**Cause:** Trying to send empty message or invalid data

**Solution:** Add validation before sending messages

**401 Unauthorized:**
```
❌ Bot error: TelegramError: 401: Unauthorized
```

**Cause:** Invalid bot token

**Solution:** Check `BOT_TOKEN` in environment variables

#### Database Errors

**Connection refused:**
```
❌ Database connection failed: ECONNREFUSED
```

**Cause:** PostgreSQL not running or wrong connection details

**Solution:** Check database status and connection settings

**Unique constraint violation:**
```
❌ Error: duplicate key value violates unique constraint "idx_unique_activity"
```

**Cause:** User tried to log same activity twice quickly

**Solution:** This is expected behavior (prevents double-clicks), no action needed

**Foreign key violation:**
```
❌ Error: insert or update on table "activities" violates foreign key constraint
```

**Cause:** Trying to create activity for non-existent user

**Solution:** Ensure user is registered before logging activities

## Health Checks

### Bot Health Check

Create a simple health check script `scripts/health-check.ts`:

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

Run it:
```bash
bun run scripts/health-check.ts
```

### Database Health Check

```sql
-- Check database connectivity
SELECT 1;

-- Check table existence
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM activities;
SELECT COUNT(*) FROM feedback;

-- Check recent activity
SELECT MAX(created_at) FROM activities;
```

Or via script:
```bash
psql -U postgres -h localhost activity_challenge_bot -c "SELECT 1;"
```

### Automated Health Checks

**With cron:**
```bash
# Add to crontab
*/5 * * * * /path/to/project/scripts/health-check.ts || echo "Bot health check failed" | mail -s "Bot Alert" admin@example.com
```

**With systemd timer** (if using systemd):
```ini
# /etc/systemd/system/bot-health-check.timer
[Unit]
Description=Bot Health Check Timer

[Timer]
OnBootSec=5min
OnUnitActiveSec=5min

[Install]
WantedBy=timers.target
```

## Performance Monitoring

### Response Time

Monitor how quickly the bot responds to commands:

```typescript
// Add timing to middleware
bot.use(async (ctx, next) => {
  const start = Date.now()
  await next()
  const duration = Date.now() - start
  
  if (duration > 1000) {
    console.log(`⚠️  Slow response: ${duration}ms for ${ctx.updateType}`)
  }
})
```

### Database Query Performance

```sql
-- Enable query timing
\timing

-- Run common queries and check duration
SELECT COUNT(*) FROM activities;

-- Check slow queries (if pg_stat_statements enabled)
SELECT 
  query,
  calls,
  mean_exec_time,
  max_exec_time
FROM pg_stat_statements
WHERE query LIKE '%activities%'
ORDER BY mean_exec_time DESC
LIMIT 10;
```

### Resource Usage

**Check bot process:**
```bash
# Find bot process
ps aux | grep bun

# Monitor CPU/Memory
top -p $(pgrep -f "bun run")

# Or with htop
htop -p $(pgrep -f "bun run")
```

**Container resource usage:**
```bash
# Docker stats
docker stats activity-challenge-bot

# Podman stats
podman stats activity-challenge-bot
```

**Kubernetes resource usage:**
```bash
# Pod resource usage
kubectl top pod activity-challenge-bot-xxxxx

# Node resource usage
kubectl top nodes
```

## User Activity Monitoring

### Active Users

```sql
-- Users who logged activity today
SELECT COUNT(DISTINCT user_id) 
FROM activities 
WHERE activity_date = CURRENT_DATE;

-- Users who logged activity this week
SELECT COUNT(DISTINCT user_id)
FROM activities
WHERE activity_date >= CURRENT_DATE - INTERVAL '7 days';

-- Most active users today
SELECT 
  u.username,
  COUNT(a.id) as activities_today
FROM activities a
JOIN users u ON u.id = a.user_id
WHERE a.activity_date = CURRENT_DATE
GROUP BY u.username
ORDER BY activities_today DESC
LIMIT 10;
```

### Activity Patterns

```sql
-- Activities logged per day (last 7 days)
SELECT 
  activity_date,
  COUNT(*) as activity_count,
  COUNT(DISTINCT user_id) as unique_users
FROM activities
WHERE activity_date >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY activity_date
ORDER BY activity_date DESC;

-- Activities by hour (when are users most active?)
SELECT 
  EXTRACT(HOUR FROM created_at) as hour,
  COUNT(*) as activities
FROM activities
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY hour
ORDER BY hour;

-- Popular activity types
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
-- Registrations per day
SELECT 
  DATE(created_at) as date,
  COUNT(*) as registrations
FROM users
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY date
ORDER BY date DESC;

-- Registrations by guild
SELECT 
  guild,
  COUNT(*) as registrations,
  MAX(created_at) as last_registration
FROM users
GROUP BY guild
ORDER BY registrations DESC;
```

## Alerting

### Simple Email Alerts

Create `scripts/alert.sh`:

```bash
#!/bin/bash

EMAIL="admin@example.com"
SUBJECT="Bot Alert"

# Check if bot is running
if ! pgrep -f "bun run" > /dev/null; then
    echo "Bot is not running!" | mail -s "$SUBJECT" "$EMAIL"
fi

# Check database connectivity
if ! psql -U postgres -h localhost activity_challenge_bot -c "SELECT 1" > /dev/null 2>&1; then
    echo "Database connection failed!" | mail -s "$SUBJECT" "$EMAIL"
fi

# Check disk space
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 90 ]; then
    echo "Disk usage is at ${DISK_USAGE}%!" | mail -s "$SUBJECT" "$EMAIL"
fi
```

Run periodically:
```bash
# Add to crontab - check every 15 minutes
*/15 * * * * /path/to/scripts/alert.sh
```

### Telegram Alerts

Send alerts to your own Telegram chat:

```typescript
// scripts/send-alert.ts
import { Telegraf } from 'telegraf'

const ALERT_BOT_TOKEN = process.env.ALERT_BOT_TOKEN!
const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID!

async function sendAlert(message: string) {
  const bot = new Telegraf(ALERT_BOT_TOKEN)
  await bot.telegram.sendMessage(ADMIN_CHAT_ID, `🚨 Alert: ${message}`)
}

// Example usage
sendAlert('Bot stopped responding!')
```

### Monitoring Services

For production, consider using:

- **Uptime monitoring:** [UptimeRobot](https://uptimerobot.com/), [Pingdom](https://www.pingdom.com/)
- **Log aggregation:** [Grafana Loki](https://grafana.com/oss/loki/), [ELK Stack](https://www.elastic.co/elastic-stack)
- **Metrics:** [Prometheus](https://prometheus.io/) + [Grafana](https://grafana.com/)
- **Error tracking:** [Sentry](https://sentry.io/)

## Troubleshooting Guides

### Bot Not Responding

**Symptoms:** Users report bot doesn't respond to commands

**Diagnosis:**
```bash
# 1. Check if bot process is running
ps aux | grep bun

# 2. Check logs for errors
tail -n 100 logs/bot.log

# 3. Check database connectivity
psql -U postgres -h localhost activity_challenge_bot -c "SELECT 1"

# 4. Test bot health
bun run scripts/health-check.ts
```

**Solutions:**

1. **Bot crashed:** Restart the bot
```bash
bun run dev
# or for containers
docker restart activity-challenge-bot
```

2. **Database down:** Start PostgreSQL
```bash
# Local
sudo systemctl start postgresql
# Container
docker start postgres
```

3. **Invalid token:** Check BOT_TOKEN environment variable
```bash
echo $BOT_TOKEN
# Should output your token
```

4. **Rate limiting:** Wait and retry (Telegram will respond with retry_after)

### Slow Performance

**Symptoms:** Bot takes several seconds to respond

**Diagnosis:**
```sql
-- Check query performance
\timing
SELECT * FROM activities WHERE user_id = 1 ORDER BY activity_date DESC LIMIT 10;

-- Check table scans
SELECT * FROM pg_stat_user_tables WHERE schemaname = 'public';

-- Check active queries
SELECT * FROM pg_stat_activity WHERE state = 'active';
```

**Solutions:**

1. **Missing indexes:** Run ANALYZE
```sql
ANALYZE users;
ANALYZE activities;
ANALYZE feedback;
```

2. **Database needs vacuum:**
```sql
VACUUM ANALYZE;
```

3. **Too many connections:** Close idle connections
```sql
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE state = 'idle' AND state_change < NOW() - INTERVAL '10 minutes';
```

4. **High load:** Check resource usage and scale if needed

### Users Can't Register

**Symptoms:** Registration wizard fails or doesn't show guilds

**Diagnosis:**
```bash
# 1. Check guild configuration
cat src/config/guilds.ts

# 2. Check logs for errors
grep -i "register" logs/bot.log

# 3. Test database connectivity
psql -U postgres -h localhost activity_challenge_bot -c "SELECT COUNT(*) FROM users"
```

**Solutions:**

1. **No active guilds:** Verify guilds in config have `isActive: true`

2. **Database issue:** Check database is accessible

3. **Bot crashed during wizard:** Restart bot, user can retry

### Points Not Updating

**Symptoms:** User logs activity but points don't update

**Diagnosis:**
```sql
-- Check if activities are being saved
SELECT * FROM activities 
WHERE user_id = (SELECT id FROM users WHERE telegram_id = '123456789')
ORDER BY created_at DESC 
LIMIT 5;

-- Check user points
SELECT * FROM users WHERE telegram_id = '123456789';

-- Check for errors in activity logging
SELECT * FROM activities WHERE points = 0 OR points IS NULL;
```

**Solutions:**

1. **Activities not saving:** Check logs for database errors

2. **Points calculation wrong:** Verify activity hierarchy data

3. **User points not updating:** Points are calculated on-demand from activities table, not stored in users.points field (check your implementation)

### Database Connection Lost

**Symptoms:** Bot can't connect to database after running fine

**Diagnosis:**
```bash
# Check PostgreSQL status
systemctl status postgresql
# or for container
docker ps | grep postgres

# Check connection
psql -U postgres -h localhost activity_challenge_bot -c "SELECT 1"

# Check for connection errors in logs
grep -i "ECONNREFUSED\|connection" logs/bot.log
```

**Solutions:**

1. **PostgreSQL crashed:** Restart PostgreSQL
```bash
sudo systemctl restart postgresql
# or
docker restart postgres
```

2. **Connection limit reached:** See Database Operations guide

3. **Network issue:** Check if host is correct (localhost vs postgres)

4. **Password changed:** Update DATABASE_URL environment variable

## Maintenance Schedule

### Daily Tasks

- ✅ Check bot is running
- ✅ Review error logs
- ✅ Monitor disk space

### Weekly Tasks

- ✅ Check database size growth
- ✅ Review slow query logs
- ✅ Analyze user activity trends
- ✅ Run VACUUM ANALYZE

### Monthly Tasks

- ✅ Review and rotate logs
- ✅ Check backup restores work
- ✅ Update dependencies
- ✅ Review guild configurations
- ✅ Full database VACUUM

### Quarterly Tasks

- ✅ Review competition performance
- ✅ Archive old competition data
- ✅ Review and optimize indexes
- ✅ Security audit (passwords, access)
- ✅ Plan next competition

## Best Practices

✅ **Centralized logging:** Aggregate logs for easier analysis
✅ **Automate monitoring:** Use scripts and cron jobs
✅ **Set up alerts:** Get notified of critical issues
✅ **Regular backups:** Daily database backups (see Database Operations)
✅ **Test disaster recovery:** Practice restoration procedures
✅ **Document incidents:** Keep notes on issues and resolutions
✅ **Monitor trends:** Track metrics over time to spot issues early
✅ **Capacity planning:** Watch resource usage, plan for growth

## Next Steps

- Set up [Database Operations](/admin/database-operations) and backups
- Configure [Competition Setup](/admin/competition-setup)
- Review [Guild Management](/admin/guild-management)
- Check [Architecture Overview](/architecture/overview) to understand the system