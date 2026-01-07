# Environment Setup

Configuration reference for the Activity Challenge Bot.

## Required Environment Variables

Create a `.env` file in the project root:

```dotenv
# Telegram Bot (required)
BOT_TOKEN=your_bot_token_here

# Database (required)
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password
POSTGRES_DB=activity_challenge_bot
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/activity_challenge_bot

# Optional
NODE_ENV=development
WEBAPP_URL=https://your-webapp.com
API_PORT=3001
```

### Getting a Bot Token

1. Message [@BotFather](https://t.me/botfather) on Telegram
2. Send `/newbot` and follow instructions
3. Copy the token to your `.env` file

⚠️ **Never commit `.env` to version control**

### Database Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `POSTGRES_HOST` | Database host | `localhost` or `postgres` (container) |
| `DATABASE_URL` | Full connection string | Constructed from above vars |

**For containers**: Use `POSTGRES_HOST=postgres` (service name from compose.yaml)

## Configuration Files

### Competition Period

Competition dates and settings are managed in code for version control and type safety.

See [Competition Setup](/admin/competition-setup.md) for detailed configuration instructions.

**Quick example:**
```typescript
// src/config/competition.ts
export const CURRENT_COMPETITION = {
  name: "Winter 2025-2026 Activity Challenge",
  startDate: new Date("2025-12-24"),
  endDate: new Date("2026-03-31")
}
```

### Guilds

Guild configuration is managed in code.

See [Guild Management](/admin/guild-management.md) for detailed configuration instructions.

**Quick example:**
```typescript
// src/config/guilds.ts
export const GUILDS = [
  { name: "TiK", totalMembers: 700, isActive: true },
  // Add more guilds...
]
```

## Environment-Specific Setup

### Local Development
```dotenv
NODE_ENV=development
POSTGRES_HOST=localhost
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/activity_challenge_bot
```

### Container Development
```dotenv
NODE_ENV=development
POSTGRES_HOST=postgres  # ← Service name from compose.yaml
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/activity_challenge_bot
```

### Production (Kubernetes)
Environment variables managed via Kubernetes secrets (see deployment docs).

## Template

Copy from `.env.example`:
```bash
cp .env.example .env
# Edit with your actual values
```

## Next Steps

- [Getting Started](/guide/getting-started.md) - Set up the project
- [Local Development](/guide/local-development.md) - Development workflow
- [Competition Setup](/admin/competition-setup.md) - Configure competition
- [Guild Management](/admin/guild-management.md) - Configure guilds