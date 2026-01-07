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
# DOCUMENTATION COMING SOON!
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

## Guild Leaderboards

Guild rankings are automatically calculated by the bot. Users can view them through:

- `/stats` command → View Rankings → Guild Rankings
- Web app (if deployed)

### How Guild Rankings Work

Rankings are calculated based on:

1. **Average points per registered user**
   - Total guild points ÷ Number of total guild members
   - This encourages high participation percentages.

2. **Participation percentage**
   - (Registered users ÷ Total members) × 100
   - Shown as additional metric

### Example Ranking Calculation

```
Guild: TiK
- Total members: 700 (from configuration)
- Registered users: 50 (from database)
- Total points: 5000 (from database)

Guild point average: 5000 / 700 ≈ 7.14 points
Participation rate: 50 / 700 = 7.14%
```

## Next Steps

- Learn about [Competition Setup](/admin/competition-setup)
- Review [Environment Setup](/guide/environment-setup)