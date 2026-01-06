# Guild Management

This guide explains how to manage guilds in the Activity Challenge Bot.

## Overview

Guilds are teams or organizations that users can join. The bot tracks points per guild and provides guild-based leaderboards and statistics. All guild configuration is managed through code - there's no database table for guilds.

## Configuration File

All guild settings are managed in `src/config/guilds.ts`.

### Guild Configuration Structure

```typescript
export interface GuildConfig {
  name: string;           // Guild display name
  totalMembers: number;   // Total members in the guild (for participation %)
  isActive: boolean;      // Whether guild is available for selection
}
```

### Current Guilds

```typescript
export const GUILDS: GuildConfig[] = [
  { name: "TiK", totalMembers: 700, isActive: true },
  { name: "SIK", totalMembers: 450, isActive: true },
  { name: "AS", totalMembers: 650, isActive: true },
  { name: "FK", totalMembers: 600, isActive: true },
  { name: "Athene", totalMembers: 350, isActive: true },
  { name: "MK", totalMembers: 400, isActive: true },
  { name: "Aalto Accounting", totalMembers: 450, isActive: true },
  { name: "Inkubio", totalMembers: 400, isActive: true },
  { name: "Prodeko", totalMembers: 650, isActive: true },
];
```

## Adding a New Guild

### Step 1: Add Guild to Configuration

Edit `src/config/guilds.ts` and add your new guild:

```typescript
export const GUILDS: GuildConfig[] = [
  // ... existing guilds ...
  { name: "New Guild", totalMembers: 500, isActive: true },
];
```

### Step 2: Deploy Changes

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
# Your deployment process
# (Handled by your friend)
```

### Step 3: Verify Guild is Available

1. Start the bot
2. Use `/start` or `/register`
3. Check if new guild appears in the selection keyboard

::: tip Immediate Availability
New guilds are immediately available once the bot restarts. Existing users can re-register to change guilds.
:::

## Modifying Existing Guilds

### Update Guild Name

```typescript
// Before
{ name: "TiK", totalMembers: 700, isActive: true }

// After
{ name: "TiK - Teollisuustekniikan kilta", totalMembers: 700, isActive: true }
```

::: warning Name Changes and Existing Users
Changing a guild name will NOT update existing users' guild affiliations in the database. Their stored guild name will remain the old name.

**Options:**
1. Keep old name (recommended)
2. Manually update database (see Database Operations)
3. Ask users to re-register
:::

### Update Total Members

Update the `totalMembers` field when your organization's membership changes:

```typescript
{ name: "TiK", totalMembers: 750, isActive: true }  // Updated from 700
```

This affects the participation percentage shown in statistics:
- Participation % = (Registered users / Total members) × 100

### Deactivate a Guild

Set `isActive: false` to prevent new registrations:

```typescript
{ name: "Old Guild", totalMembers: 500, isActive: false }
```

**Effects:**
- Guild no longer appears in registration keyboard
- Existing users with this guild are unaffected
- Guild still appears in leaderboards if users exist

::: tip When to Deactivate
- Guild is merging with another
- Guild is no longer participating
- Temporary suspension from competition
:::

## Guild Helper Functions

The configuration exports several helper functions used throughout the bot:

### `getActiveGuilds()`

Get all active guilds:

```typescript
import { getActiveGuilds } from '@/config/guilds';

const active = getActiveGuilds();
// Returns: Array of GuildConfig with isActive: true
```

### `getGuildConfig(name)`

Get configuration for a specific guild:

```typescript
import { getGuildConfig } from '@/config/guilds';

const guild = getGuildConfig("TiK");
// Returns: { name: "TiK", totalMembers: 700, isActive: true }
```

### `getGuildNames()`

Get sorted list of active guild names:

```typescript
import { getGuildNames } from '@/config/guilds';

const names = getGuildNames();
// Returns: ["Aalto Accounting", "AS", "Athene", "FK", ...]
```

### `isValidGuild(name)`

Validate if a guild name is valid and active:

```typescript
import { isValidGuild } from '@/config/guilds';

if (isValidGuild("TiK")) {
  // Allow registration
}
```

### `getGuildTotalMembers(name)`

Get total member count:

```typescript
import { getGuildTotalMembers } from '@/config/guilds';

const total = getGuildTotalMembers("TiK");
// Returns: 700
```

## Guild Statistics

### View Guild Participation

```sql
-- Guild participation overview
SELECT 
  u.guild,
  COUNT(*) as registered_users,
  SUM(u.points) as total_points,
  AVG(u.points) as avg_points_per_user
FROM users u
WHERE u.guild IS NOT NULL
GROUP BY u.guild
ORDER BY total_points DESC;
```

### Find Users by Guild

```sql
-- List all users in a specific guild
SELECT 
  username,
  first_name,
  last_name,
  points,
  created_at
FROM users
WHERE guild = 'TiK'
ORDER BY points DESC;
```

### Guild Activity Summary

```sql
-- Guild activity statistics
SELECT 
  u.guild,
  COUNT(DISTINCT u.id) as active_users,
  COUNT(a.id) as total_activities,
  SUM(a.points) as total_points
FROM users u
LEFT JOIN activities a ON a.user_id = u.id
WHERE u.guild IS NOT NULL
GROUP BY u.guild
ORDER BY total_points DESC;
```

## Managing Guild Data

### Bulk Update Guild Names

If you need to update guild names for existing users:

```sql
-- Update guild name in database
UPDATE users 
SET guild = 'New Guild Name'
WHERE guild = 'Old Guild Name';

-- Verify update
SELECT COUNT(*) FROM users WHERE guild = 'New Guild Name';
```

### Transfer Users Between Guilds

```sql
-- Move users from one guild to another
UPDATE users 
SET guild = 'Target Guild'
WHERE guild = 'Source Guild';
```

::: warning Data Integrity
Always backup database before bulk updates! See [Database Operations](/admin/database-operations) for backup procedures.
:::

### Find Users with Invalid Guilds

```sql
-- Users with guilds not in configuration
SELECT u.username, u.guild, u.points
FROM users u
WHERE u.guild IS NOT NULL
AND u.guild NOT IN ('TiK', 'SIK', 'AS', 'FK', 'Athene', 
                     'MK', 'Aalto Accounting', 'Inkubio', 'Prodeko');
```

## Guild Leaderboards

Guild rankings are automatically calculated by the bot. Users can view them through:

- `/stats` command → View Rankings → Guild Rankings
- Web app (if deployed)

### How Guild Rankings Work

Rankings are calculated based on:

1. **Average points per registered user**
   - Total guild points ÷ Number of registered users
   - This prevents large guilds from dominating

2. **Participation percentage**
   - (Registered users ÷ Total members) × 100
   - Shown as additional metric

### Example Ranking Calculation

```
Guild: TiK
- Total members: 700 (from configuration)
- Registered users: 50 (from database)
- Total points: 5000 (from database)

Average points per user: 5000 / 50 = 100 points
Participation rate: 50 / 700 = 7.14%
```

## Troubleshooting

### Guild Not Appearing in Keyboard

**Problem:** New guild doesn't show in registration keyboard.

**Checklist:**
1. ✅ Added to `GUILDS` array
2. ✅ Set `isActive: true`
3. ✅ Saved `guilds.ts`
4. ✅ Restarted bot

**Solution:** Verify configuration and restart:

```bash
# Check config
cat src/config/guilds.ts | grep "New Guild"

# Restart bot
bun run dev
```

### Users Registered with Wrong Guild

**Problem:** User selected wrong guild during registration.

**Solution:** Users can re-register:
1. User goes to Profile → Delete Account
2. User registers again with correct guild

**Alternative:** Manual database update:

```sql
UPDATE users 
SET guild = 'Correct Guild'
WHERE telegram_id = '123456789';
```

### Guild Rankings Seem Wrong

**Problem:** Guild rankings don't match expectations.

**Possible Causes:**
1. **totalMembers is outdated** → Update in configuration
2. **Users registered with wrong guild** → Verify user data
3. **Points not updating** → Check activity logging

**Verification Query:**

```sql
-- Detailed guild breakdown
SELECT 
  u.guild,
  COUNT(*) as registered,
  SUM(u.points) as total_points,
  AVG(u.points) as avg_points,
  COUNT(a.id) as activities_count
FROM users u
LEFT JOIN activities a ON a.user_id = u.id
WHERE u.guild = 'TiK'
GROUP BY u.guild;
```

### Database Has Unknown Guilds

**Problem:** Database contains guild names not in configuration.

**Causes:**
- Guild was removed from config
- Guild was renamed
- Data import with old guild names

**Solutions:**

1. **Add back to config if still valid:**
```typescript
{ name: "Old Guild", totalMembers: 500, isActive: false }
```

2. **Migrate users to active guild:**
```sql
UPDATE users SET guild = 'Active Guild' WHERE guild = 'Old Guild';
```

## Best Practices

✅ **Consistent naming:** Use official guild names and abbreviations
✅ **Update member counts:** Review and update `totalMembers` each competition
✅ **Deactivate, don't delete:** Set `isActive: false` instead of removing guilds
✅ **Communicate changes:** Inform guild coordinators of any changes
✅ **Document decisions:** Keep notes on why guilds were added/removed
✅ **Regular audits:** Check for users with invalid guilds
✅ **Backup first:** Always backup before bulk updates

## Guild Coordinators

Consider appointing guild coordinators who can:
- Encourage guild members to register
- Promote activities within their guild
- Report issues or suggestions
- Help verify total member counts

This is handled outside the bot (email, Telegram groups, etc.)

## Advanced Topics

### Guild Validation in Code

The bot validates guilds at registration time in `src/flows/register/steps/2-guild.ts`. Guild names are validated using:

```typescript
import { isValidGuild } from '@/config/guilds';

if (!isValidGuild(selectedGuild)) {
  await ctx.reply('❌ Invalid guild selection');
  return;
}
```

### No Foreign Keys

Note that guilds are **not** enforced by database foreign keys. This is intentional:
- Allows flexibility in guild management
- Prevents migration headaches when guilds change
- Validation happens in application code

### Custom Guild Logic

If you need custom logic per guild (e.g., different point multipliers), you can:

1. Add fields to `GuildConfig`:
```typescript
export interface GuildConfig {
  name: string;
  totalMembers: number;
  isActive: boolean;
  pointMultiplier?: number;  // Custom field
}
```

2. Update point calculation in `src/db/points.ts`

This requires code changes beyond configuration.

## Next Steps

- Learn about [Competition Setup](/admin/competition-setup)
- Configure [Database Operations](/admin/database-operations)
- Set up [Monitoring](/admin/monitoring)
- Review [Environment Setup](/guide/environment-setup)