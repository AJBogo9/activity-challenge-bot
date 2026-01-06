# Environment Setup

This guide explains all environment variables and configuration options for the Activity Challenge Bot.

## Environment Variables

The bot uses environment variables for configuration. These are stored in a `.env` file at the project root.

### Required Variables

#### BOT_TOKEN

**Description**: Telegram Bot API token  
**Required**: Yes  
**Example**: `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz`

Get this from [@BotFather](https://t.me/botfather):
1. Send `/newbot`
2. Follow the instructions to create your bot
3. Copy the token provided

```env
BOT_TOKEN=your_bot_token_here
```

::: warning Security
Never commit your bot token to version control! The `.env` file is in `.gitignore` by default.
:::

#### Database Variables

**Required**: Yes (all of them)

```env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DB=activity_challenge_bot
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
DATABASE_URL=postgresql://postgres:your_secure_password@localhost:5432/activity_challenge_bot
```

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `POSTGRES_USER` | Database username | `postgres` | `postgres` |
| `POSTGRES_PASSWORD` | Database password | Required | `my_secure_pass123` |
| `POSTGRES_DB` | Database name | `activity_challenge_bot` | `activity_challenge_bot` |
| `POSTGRES_HOST` | Database host | `localhost` | `localhost` or `postgres` |
| `POSTGRES_PORT` | Database port | `5432` | `5432` |
| `DATABASE_URL` | Full connection string | Required | See above |

::: tip Container Development
When using Docker/Podman compose, set `POSTGRES_HOST=postgres` (the service name) instead of `localhost`.
:::

### Optional Variables

#### NODE_ENV

**Description**: Environment mode  
**Required**: No  
**Default**: `development`  
**Options**: `development`, `production`, `test`

```env
NODE_ENV=development
```

Effects:
- `development`: Verbose logging, hot reload
- `production`: Minimal logging, optimized performance
- `test`: Used by test suite

#### WEBAPP_URL

**Description**: URL of the web app (mini app)  
**Required**: Only if using web app features  
**Example**: `https://your-webapp.com`

```env
WEBAPP_URL=https://your-webapp.com
```

::: info Web App
The web app is a separate React application that shows statistics and rankings. It's optional for bot functionality.
:::

#### API_PORT

**Description**: Port for the web app API server  
**Required**: Only if using web app  
**Default**: `3001`

```env
API_PORT=3001
```

## Configuration Files

### Competition Configuration

Edit `src/config/competition.ts` to set up competition periods:

```typescript
export const CURRENT_COMPETITION: CompetitionConfig = {
  name: "Winter 2025-2026 Activity Challenge",
  startDate: new Date("2025-12-24"),
  endDate: new Date("2026-03-31"),
  description: "Q1 2026 fitness challenge"
}
```

::: warning Date Format
Always use ISO 8601 format: `YYYY-MM-DD`
:::

### Guild Configuration

Edit `src/config/guilds.ts` to add or modify guilds:

```typescript
export const GUILDS = [
  { shortName: 'AK', fullName: 'Athene' },
  { shortName: 'AS', fullName: 'Prodeko' },
  { shortName: 'FK', fullName: 'Inkubio' },
  // Add more guilds here
]
```

Each guild needs:
- `shortName`: Short identifier (2-4 characters)
- `fullName`: Full guild name

::: tip Guild Management
See [Guild Management](/admin/guild-management) for more details on managing guilds.
:::

## Environment Setup by Deployment Type

### Local Development

**File**: `.env`

```env
NODE_ENV=development
BOT_TOKEN=your_dev_bot_token
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=activity_challenge_bot
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/activity_challenge_bot
```

### Container Development (Docker/Podman)

**File**: `.env`

```env
NODE_ENV=development
BOT_TOKEN=your_dev_bot_token
POSTGRES_HOST=postgres        # Service name in compose.yaml
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=activity_challenge_bot
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/activity_challenge_bot
```

::: warning Host Name
When using compose, `POSTGRES_HOST` must match the service name in `compose.yaml` (usually `postgres`).
:::

### Kubernetes Deployment

Environment variables are stored in Kubernetes secrets. See deployment documentation for details.

**Not documented here** - your friend is handling deployment documentation.

## Validation and Troubleshooting

### Testing Your Configuration

Create a simple test script:

```typescript
// test-config.ts
import 'dotenv/config'

console.log('Environment:', process.env.NODE_ENV)
console.log('Bot token:', process.env.BOT_TOKEN ? '✓ Set' : '✗ Missing')
console.log('Database URL:', process.env.DATABASE_URL ? '✓ Set' : '✗ Missing')
```

Run it:

```bash
bun test-config.ts
```

### Common Issues

#### "BOT_TOKEN is required"

**Problem**: Bot token environment variable not set or not loaded.

**Solutions**:
1. Check `.env` file exists in project root
2. Verify BOT_TOKEN is set: `cat .env | grep BOT_TOKEN`
3. Restart your terminal to reload environment
4. For containers: rebuild with `bun run pod:up --build`

#### "Database connection failed"

**Problem**: Can't connect to PostgreSQL.

**Solutions**:

1. **Check database is running**:
   ```bash
   # For containers
   docker ps | grep postgres
   
   # For local PostgreSQL
   pg_isready -h localhost -p 5432
   ```

2. **Verify credentials**:
   ```bash
   psql -U postgres -h localhost -d activity_challenge_bot
   ```

3. **Check host name**:
   - Local: Use `localhost`
   - Container: Use service name (usually `postgres`)

4. **Verify DATABASE_URL format**:
   ```
   postgresql://user:password@host:port/database
   ```

#### "Port 3001 already in use"

**Problem**: Another service is using the API port.

**Solution**: Change the port in `.env`:

```env
API_PORT=3002
```

Or kill the existing process:

```bash
lsof -i :3001
kill -9 <PID>
```

## Security Best Practices

### Development

- ✅ Use `.env` file for local development
- ✅ Keep `.env` in `.gitignore`
- ✅ Use separate bot tokens for dev/prod
- ✅ Use weak passwords for local database

### Production

- ✅ Use environment variables (not `.env` file)
- ✅ Use secrets management (Kubernetes secrets, etc.)
- ✅ Use strong, randomly generated passwords
- ✅ Rotate credentials regularly
- ✅ Limit database user permissions
- ✅ Use SSL/TLS for database connections

::: danger Never Commit Secrets
Never commit `.env` files or any files containing:
- Bot tokens
- Database passwords
- API keys
- Private keys
:::

## Template Files

### Complete .env Template

```env
# ======================
# Environment
# ======================
NODE_ENV=development

# ======================
# Telegram Bot
# ======================
BOT_TOKEN=your_bot_token_here

# ======================
# Mini App Configuration
# ======================
WEBAPP_URL=https://your-webapp.com
API_PORT=3001

# ======================
# PostgreSQL Database
# ======================
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DB=activity_challenge_bot
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
DATABASE_URL=postgresql://postgres:your_secure_password@localhost:5432/activity_challenge_bot
```

### .env.example

This file is committed to the repository as a template:

```bash
cp .env.example .env
# Then edit .env with your actual values
```

### .env.test

For running tests:

```env
NODE_ENV=test
BOT_TOKEN=test-bot-token-12345
DATABASE_URL=postgresql://testuser:testpass@localhost:5432/testdb
```

## Next Steps

- Set up your [Local Development](/guide/local-development) environment
- Learn about [Competition Setup](/admin/competition-setup)
- Understand [Guild Management](/admin/guild-management)