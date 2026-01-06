# Competition Setup

Quick guide for configuring competition periods.

## Configuration

Edit `src/config/competition.ts`:

```typescript
export const CURRENT_COMPETITION: CompetitionConfig = {
  name: "Winter 2025-2026 Activity Challenge",
  startDate: new Date("2025-12-24"),  // ISO 8601 format
  endDate: new Date("2026-03-31"),
  description: "Q1 2026 fitness challenge"
}
```

**Required fields:**
- `name`: Display name for users
- `startDate`: Competition begins (activities before this rejected)
- `endDate`: Competition ends (activities after this rejected)
- `description`: Optional context

⚠️ **Always use ISO 8601 date format: `YYYY-MM-DD`**

## Validation

The bot validates configuration on startup:
- Dates are valid
- Start date before end date
- Throws error if validation fails

```bash
# Test your config
bun run dev

# You should see:
# ✅ Database migrations completed
# 🤖 Bot started successfully
```

## Deployment

### Local Development
```bash
bun run dev  # Restart bot
```

### Container
```bash
bun run pod:down
bun run pod:up --build
```

### Kubernetes
Your deployment process (handled by your friend)

## Competition Lifecycle

**Before Start:**
- Users can register
- Activities cannot be logged
- Bot shows "Competition starts in X days"

**During:**
- Full functionality active
- Activities can be logged
- Bot shows "X days remaining"

**After End:**
- Activities cannot be logged
- Statistics remain viewable
- Bot shows "Competition has ended"

**Data Persistence:** User data and history persist after competition ends.

## Helper Functions

Available in code:

```typescript
import { 
  isCompetitionActive,
  getDaysRemaining,
  getDaysElapsed,
  getCompetitionProgress 
} from '@/config/competition'

// Check if competition is active
if (isCompetitionActive()) {
  // Allow activity logging
}

// Get days remaining
const days = getDaysRemaining()  // Returns 0 if ended

// Get days elapsed
const elapsed = getDaysElapsed()  // Returns 0 if not started

// Get progress percentage
const progress = getCompetitionProgress()  // 0-100
```

## Planning Timeline

**4 weeks before:**
- Update configuration
- Test in development
- Prepare announcement

**2 weeks before:**
- Deploy to production
- Announce to guilds

**On start:**
- Monitor for issues
- Send reminder

**During:**
- Monitor activity logs
- Respond to feedback

**On end:**
- Announce results
- Plan next competition

## Troubleshooting

**Invalid date format:**
```typescript
// ❌ Wrong
startDate: new Date("24-12-2025")

// ✅ Correct
startDate: new Date("2025-12-24")
```

**Start after end:**
```typescript
// ❌ Wrong
startDate: new Date("2026-06-30")
endDate: new Date("2026-04-01")

// ✅ Correct
startDate: new Date("2026-04-01")
endDate: new Date("2026-06-30")
```

**Config not updating:**
1. Saved `competition.ts`?
2. Restarted bot/container?
3. Check logs for errors
4. Verify deployment completed

## Data Management

### Archive Old Competition

```sql
-- Create archive
CREATE TABLE activities_archive_2025 AS 
SELECT * FROM activities 
WHERE activity_date BETWEEN '2025-12-24' AND '2026-03-31';

-- Verify
SELECT COUNT(*) FROM activities_archive_2025;
```

See [Database Operations](/admin/database-operations) for details.

### Competition Statistics

```sql
-- Overall stats
SELECT 
  COUNT(DISTINCT user_id) as active_users,
  COUNT(*) as total_activities,
  SUM(points) as total_points
FROM activities
WHERE activity_date BETWEEN '2025-12-24' AND '2026-03-31';
```

## Best Practices

✅ Plan 4+ weeks ahead
✅ Test in dev first
✅ Communicate changes clearly
✅ Monitor closely first few days
✅ Archive old data
✅ Document what worked well

## Next Steps

- [Guild Management](/admin/guild-management)
- [Database Operations](/admin/database-operations)
- [Monitoring](/admin/monitoring)