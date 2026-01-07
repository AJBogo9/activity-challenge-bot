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
# DOCUMENTATION COMING SOON!
```

### Step 4: Announce to Users

After deploying the new competition:

1. Send an announcement message to all users (manual process)
2. Users can check competition status with `/start` or navigation buttons

## Next Steps

- Learn about [Guild Management](/admin/guild-management)
- Review [Competition Setup](/guide/environment-setup) for environment variables