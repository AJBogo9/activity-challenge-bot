# Environment Setup

Configuration reference for the Activity Challenge Bot.

## Required Environment Variables

Create a `.env` file in the project root:

```env
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

Edit `src/config/competition.ts`:

```typescript
export const CURRENT_COMPETITION: CompetitionConfig = {
  name: "Winter 2025-2026 Activity Challenge",
  startDate: new Date("2025-12-24"),  // ISO 8601 format
  endDate: new Date("2026-03-31"),
  description: "Q1 2026 fitness challenge"
}
```

⚠️ Always use `YYYY-MM-DD` format for dates.

See [Competition Setup](/admin/competition-setup) for details.

### Guilds

Edit `src/config/guilds.ts`:

```typescript
export const GUILDS: GuildConfig[] = [
  { name: "TiK", totalMembers: 700, isActive: true },
  { name: "SIK", totalMembers: 450, isActive: true },
  // Add more guilds here
]
```

See [Guild Management](/admin/guild-management) for details.

## Environment-Specific Setup

### Local Development
```env
NODE_ENV=development
POSTGRES_HOST=localhost
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/activity_challenge_bot
```

### Container Development
```env
NODE_ENV=development
POSTGRES_HOST=postgres  # ← Service name from compose.yaml
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/activity_challenge_bot
```

### Production (Kubernetes)
Environment variables managed via Kubernetes secrets (see deployment docs).

## Quick Troubleshooting

**"BOT_TOKEN is required"**
- Check `.env` exists in project root
- Verify `BOT_TOKEN` is set: `cat .env | grep BOT_TOKEN`
- Restart terminal/container

**"Database connection failed"**
```bash
# Check PostgreSQL is running
docker ps | grep postgres  # Container
pg_isready -h localhost -p 5432  # Local

# Test connection
psql $DATABASE_URL -c "SELECT 1"
```

**"Port already in use"**
- Change `API_PORT` in `.env`
- Or kill process: `lsof -i :3001` then `kill -9 <PID>`

## Template

Copy from `.env.example`:
```bash
cp .env.example .env
# Edit with your actual values
```

## Security Notes

**Development**: Use weak passwords, same bot token
**Production**: 
- Strong random passwords
- Separate bot token
- Kubernetes secrets for sensitive data
- See [PostgreSQL Security](https://www.postgresql.org/docs/current/auth-methods.html)

## Next Steps

- [Getting Started](/guide/getting-started)
- [Local Development](/guide/local-development)
- [Competition Setup](/admin/competition-setup)