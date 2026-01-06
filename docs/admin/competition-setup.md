# Competition Setup

This guide explains how to configure and manage competition periods for the Activity Challenge Bot.

## Overview

Competitions are time-bound periods during which users can log activities and earn points. The bot supports running one active competition at a time, with automatic validation and helper functions for competition status.

## Configuration File

All competition settings are managed in `src/config/competition.ts`.

### Basic Configuration

```typescript
export const CURRENT_COMPETITION: CompetitionConfig = {
  name: "Winter 2025-2026 Activity Challenge",
  startDate: new Date("2025-12-24"),
  endDate: new Date("2026-03-31"),
  description: "Q1 2026 fitness challenge"
};
```

### Configuration Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Competition display name shown to users |
| `startDate` | Date | Yes | When the competition begins (ISO 8601 format) |
| `endDate` | Date | Yes | When the competition ends (ISO 8601 format) |
| `description` | string | No | Additional context about the competition |

## Creating a New Competition

### Step 1: Update Configuration

Edit `src/config/competition.ts`:

```typescript
export const CURRENT_COMPETITION: CompetitionConfig = {
  name: "Summer 2026 Activity Challenge",
  startDate: new Date("2026-04-01"),
  endDate: new Date("2026-06-30"),
  description: "Q2 2026 fitness challenge"
};
```

::: tip Date Format
Always use ISO 8601 format: `YYYY-MM-DD`. The configuration includes automatic validation that runs on startup.
:::

### Step 2: Validate Configuration

The bot automatically validates competition dates when starting:

- ✅ Checks dates are valid
- ✅ Ensures start date is before end date
- ✅ Throws errors if validation fails

To test your configuration:

```bash
# Start the bot
bun run dev

# You should see:
# ✅ Database migrations completed
# 🤖 Bot started successfully
```

If validation fails, you'll see an error like:

```
Error: Competition start date must be before end date
```

### Step 3: Deploy Changes

**For local development:**
```bash
# Restart the bot
bun run dev
```

**For container deployment:**
```bash
# Rebuild and restart
bun run pod:down
bun run pod:up --build
```

**For Kubernetes:**
```bash
# Your deployment process here
# (Handled by your friend)
```

### Step 4: Announce to Users

After deploying the new competition:

1. Send an announcement message to all users (manual process)
2. Users can check competition status with `/start` or navigation buttons

## Competition Lifecycle

### Before Competition Starts

- Users can register and set up profiles
- Points cannot be logged yet (activities before start date are rejected)
- Bot shows "Competition starts in X days"

### During Competition

- Users can log activities and earn points
- All statistics and leaderboards are active
- Bot shows "X days remaining"

### After Competition Ends

- Points can no longer be logged
- Statistics and leaderboards remain viewable
- Bot shows "Competition has ended"

::: warning Data Persistence
User data and activity history persist after competition ends. Start a new competition by updating dates - no data loss occurs.
:::

## Helper Functions

The configuration exports several helper functions:

### `isCompetitionActive(date?)`

Check if competition is currently active:

```typescript
import { isCompetitionActive } from '@/config/competition';

if (isCompetitionActive()) {
  // Allow activity logging
} else {
  // Show competition ended message
}
```

### `getDaysRemaining(date?)`

Get number of days until competition ends:

```typescript
import { getDaysRemaining } from '@/config/competition';

const days = getDaysRemaining();
// Returns: 45 (if 45 days left)
// Returns: 0 (if competition ended)
```

### `getDaysElapsed(date?)`

Get number of days since competition started:

```typescript
import { getDaysElapsed } from '@/config/competition';

const days = getDaysElapsed();
// Returns: 30 (if 30 days into competition)
// Returns: 0 (if competition hasn't started)
```

### `getCompetitionProgress(date?)`

Get competition progress as percentage:

```typescript
import { getCompetitionProgress } from '@/config/competition';

const progress = getCompetitionProgress();
// Returns: 33 (if 33% complete)
// Returns: 0 (if not started)
// Returns: 100 (if ended)
```

## Competition Planning

### Recommended Timeline

**4 weeks before start:**
- Update competition configuration
- Test in development environment
- Prepare announcement message

**2 weeks before start:**
- Deploy to production
- Announce competition to guilds
- Share registration information

**On start date:**
- Monitor for any issues
- Send reminder to register

**During competition:**
- Monitor activity logs
- Check for suspicious activity
- Respond to user feedback

**On end date:**
- Announce final results
- Share guild rankings
- Begin planning next competition

### Competition Duration Recommendations

- **Short (1-2 months)**: High intensity, good for trial runs
- **Medium (3-4 months)**: Balanced, allows habit formation
- **Long (5-6 months)**: Can maintain year-round engagement

::: tip Seasonal Competitions
Consider aligning competitions with:
- Academic semesters
- Seasons (winter, spring, summer, fall)
- Major holidays or events
:::

## Troubleshooting

### Invalid Date Format Error

**Problem:** `Invalid competition start date` error on startup.

**Solution:** Check date format in configuration:

```typescript
// ❌ Wrong
startDate: new Date("24-12-2025")

// ✅ Correct
startDate: new Date("2025-12-24")
```

### Start Date After End Date

**Problem:** `Competition start date must be before end date` error.

**Solution:** Verify your dates:

```typescript
// ❌ Wrong
startDate: new Date("2026-06-30")
endDate: new Date("2026-04-01")

// ✅ Correct
startDate: new Date("2026-04-01")
endDate: new Date("2026-06-30")
```

### Bot Accepting Old Activities

**Problem:** Users can log activities from previous competitions.

**Current Behavior:** The bot allows activities to be logged with any date, as long as the competition is currently active. This is intentional to allow users to log activities they forgot to enter.

**Note:** If you want to restrict activity dates to only the competition period, this would require code changes in the activity logging flow.

### Competition Status Not Updating

**Problem:** Bot still shows old competition after configuration update.

**Solution:**
1. Verify you saved `competition.ts`
2. Restart the bot/container
3. Check logs for validation errors
4. Ensure deployment completed successfully

## Data Management

### Activities Logged Outside Competition

Activities are stored with their `activity_date`, which is separate from when they were logged (`created_at`). The bot currently allows logging activities with any date as long as the competition is active.

To find activities logged outside competition dates:

```sql
-- Activities with dates outside current competition
SELECT u.username, a.activity_type, a.activity_date, a.points
FROM activities a
JOIN users u ON u.id = a.user_id
WHERE a.activity_date < '2025-12-24'  -- Before competition start
   OR a.activity_date > '2026-03-31'  -- After competition end
ORDER BY a.activity_date DESC;
```

### Competition Statistics

Get competition overview:

```sql
-- Overall competition stats
SELECT 
  COUNT(DISTINCT user_id) as active_users,
  COUNT(*) as total_activities,
  SUM(points) as total_points,
  AVG(points) as avg_points_per_activity
FROM activities
WHERE activity_date BETWEEN '2025-12-24' AND '2026-03-31';
```

### Archive Old Competition Data

If you want to archive data before starting a new competition:

```sql
-- Create archive table
CREATE TABLE activities_2025_winter AS 
SELECT * FROM activities 
WHERE activity_date BETWEEN '2025-12-24' AND '2026-03-31';

-- Verify archive
SELECT COUNT(*) FROM activities_2025_winter;
```

::: warning Data Retention
Consider your data retention policy. Archive old competitions but keep for analysis and user history.
:::

## Advanced Configuration

### Multiple Competitions Per Year

For multiple competitions, you can:

1. **Sequential competitions:** Update dates after each competition ends
2. **Separate databases:** Run different bot instances with separate databases
3. **Competition ID system:** (Requires code changes) Add competition_id to track multiple periods

### Competition Modes

The current implementation supports one competition mode. To add different modes (e.g., team vs individual):

1. Add `mode` field to `CompetitionConfig`
2. Update scoring logic in `src/db/points.ts`
3. Modify leaderboard queries in stats flows

This requires code changes beyond configuration.

## Best Practices

✅ **Plan ahead:** Configure competitions at least 2 weeks before start
✅ **Test first:** Validate in development before production deployment
✅ **Communicate clearly:** Announce competition details to all guilds
✅ **Monitor closely:** Check activity logs during first few days
✅ **Archive data:** Keep historical data for analysis
✅ **Gather feedback:** Use `/feedback` command to improve next competition
✅ **Document changes:** Keep notes on what worked well each competition

## Next Steps

- Learn about [Guild Management](/admin/guild-management)
- Set up [Database Operations](/admin/database-operations)
- Configure [Monitoring](/admin/monitoring)
- Review [Competition Setup](/guide/environment-setup) for environment variables