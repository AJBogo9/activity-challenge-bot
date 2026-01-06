# Local Development

This guide covers everything you need to know about developing the Activity Challenge Bot on your local machine.

## Development Workflow

### Starting Your Development Session

```bash
# 1. Pull latest changes
git pull origin main

# 2. Install/update dependencies
bun install

# 3. Start the database (if using containers)
bun run pod:up

# 4. Start the bot in development mode
bun run dev
```

The bot will automatically restart when you make changes to any TypeScript file.

### Making Changes

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Edit code in `src/`
   - The bot restarts automatically with `bun run dev`
   - Test changes in Telegram immediately

3. **Test your changes**
   ```bash
   bun test
   ```

4. **Lint your code**
   ```bash
   bun run lint
   ```

5. **Commit and push**
   ```bash
   git add .
   git commit -m "feat: add new feature"
   git push origin feature/your-feature-name
   ```

## Development Scripts

### Bot Scripts

```bash
# Start bot in development mode (hot reload)
bun run dev

# Start bot in production mode
bun run start

# Add test data to database
bun run populate

# Clear all data from database (keeps schema)
bun run clear
```

### Container Scripts

```bash
# Start services (bot + database) in development mode
bun run pod:dev

# Start services in background
bun run pod:up

# Stop services
bun run pod:down

# Restart just the bot
bun run pod:restart

# View bot logs (follow mode)
bun run pod:logs

# Open shell in bot container
bun run pod:shell
```

### Container Utilities

```bash
# Populate test data in container
bun run pod:populate

# Clear data in container
bun run pod:clear

# Initialize guilds in container
bun run pod:init-guilds

# Run tests in container
bun run pod:test
```

### Database Scripts

```bash
# Open PostgreSQL shell (container)
bun run pod:db:psql

# From there, you can run SQL queries:
# \dt          - List tables
# \d users     - Describe users table
# SELECT * FROM users;
```

See [Database Operations](/admin/database-operations.md) for more database management tasks.

### Testing Scripts

```bash
# Run all tests once
bun test

# Run tests in watch mode (re-runs on file changes)
bun run test:watch

# Run tests with coverage report
bun run test:coverage
```

See [Testing Guide](/development/testing.md) for detailed testing patterns.

### Documentation Scripts

```bash
# Start docs dev server
bun run docs:dev

# Build docs for production
bun run docs:build

# Preview production docs build
bun run docs:preview
```

### Web App Scripts

```bash
# Install webapp dependencies
bun run webapp:install

# Start webapp dev server
bun run webapp:dev

# Build webapp for production
bun run webapp:build
```

## Working with the Database

### Direct Database Access

#### Using the Container

```bash
# Open psql in the container
bun run pod:db:psql

# Now you're in the PostgreSQL shell
activity_challenge=# \dt                    # List tables
activity_challenge=# SELECT * FROM users;   # Query users
activity_challenge=# \q                     # Quit
```

#### Using Local PostgreSQL

```bash
psql -U postgres -d activity_challenge_bot
```

### Common Database Tasks

See [Database Operations](/admin/database-operations.md) for comprehensive database management, including:
- Backup and restore procedures
- Data export for analysis
- Archive old competition data
- Security best practices

**Quick queries for development:**

#### View All Users

```sql
SELECT id, username, first_name, guild, points 
FROM users 
ORDER BY points DESC;
```

#### View Recent Activities

```sql
SELECT u.username, a.activity_type, a.duration, a.points, a.activity_date
FROM activities a
JOIN users u ON a.user_id = u.id
ORDER BY a.created_at DESC
LIMIT 10;
```

#### View Guild Standings

```sql
SELECT guild, COUNT(*) as member_count, SUM(points) as total_points, AVG(points) as avg_points
FROM users
WHERE guild IS NOT NULL
GROUP BY guild
ORDER BY total_points DESC;
```

### Database Migrations

Migrations are run automatically when:
- The bot starts (`bun run dev` or `bun run start`)
- Containers start (`bun run pod:up`)

To run migrations manually:

```bash
# From project root
bun src/db/migrate.ts
```

The migration script reads `src/db/schema.sql` and uses `IF NOT EXISTS` so it's safe to run multiple times.

## Development Best Practices

### Hot Reload

The bot automatically restarts when you save changes to any `.ts` file. However:

- **Environment variables** require a manual restart (see [Environment Setup](/guide/environment-setup.md))
- **Database schema changes** require running migrations
- **Package.json changes** require `bun install` and restart

### Testing Your Changes

1. **Unit Tests**: Add tests to `tests/` for new functions (see [Testing Guide](/development/testing.md))
2. **Manual Testing**: Test flows in Telegram
3. **Database Testing**: Verify data integrity with SQL queries

### Debugging

#### Enable Verbose Logging

Add debug statements:

```typescript
console.log('Debug info:', someVariable)
```

Watch logs in real-time:

```bash
# Local development
# Logs appear in terminal where you ran `bun run dev`

# Container development
bun run pod:logs
```

See [Monitoring](/admin/monitoring.md) for production logging strategies.

#### Database Debugging

View queries as they execute by modifying `src/db/connection.ts`:

```typescript
const sql = postgres(connectionString, {
  debug: true,  // Add this line
  onnotice: () => {}
})
```

#### Bot API Debugging

To see raw Telegram updates, add to your bot setup:

```typescript
bot.use((ctx, next) => {
  console.log('Update:', JSON.stringify(ctx.update, null, 2))
  return next()
})
```

### Working with Flows

When adding or modifying conversation flows (see [Flows and Wizards](/architecture/flows-and-wizards.md)):

1. **Test the happy path**: User completes the flow normally
2. **Test cancellation**: User cancels at each step
3. **Test /start escape**: User presses /start mid-flow
4. **Test invalid input**: User sends unexpected data
5. **Test rapid clicking**: User clicks multiple buttons quickly

Example test session:
```bash
# Terminal 1: Run bot
bun run dev

# Terminal 2: Watch database
watch -n 1 'psql -U postgres -d activity_challenge_bot -c "SELECT COUNT(*) FROM activities"'
```

### Managing Test Data

#### Populate Realistic Data

```bash
bun run populate
```

This creates 50+ users, 200+ activities, and realistic point distributions.

#### Clear Data Between Tests

```bash
bun run clear
```

Removes all data but keeps table structure, indexes, and constraints.

#### Custom Test Scenarios

Edit `scripts/populateTestData.ts` to create specific scenarios.

## IDE Setup

### VS Code

Recommended extensions:
- **Bun for Visual Studio Code** - Bun support
- **ESLint** - Linting
- **PostgreSQL** - Database queries
- **VitePress** - Documentation

Recommended settings (`.vscode/settings.json`):

```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib"
}
```

### Debugging in VS Code

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Bot",
      "runtimeExecutable": "bun",
      "runtimeArgs": ["run", "dev"],
      "skipFiles": ["<node_internals>/**"]
    }
  ]
}
```

## Performance Optimization

### Database Query Performance

Always use indexed columns in WHERE clauses (see [Database Schema](/architecture/database.md) for index details):

```typescript
// ✅ Good - uses index
await getActivitiesByUserId(userId)

// ❌ Bad - full table scan
await sql`SELECT * FROM activities WHERE description LIKE '%running%'`
```

### Memory Management

When processing large datasets:

```typescript
// ✅ Good - streams results
for await (const activity of sql`SELECT * FROM activities`) {
  processActivity(activity)
}

// ❌ Bad - loads all into memory
const allActivities = await sql`SELECT * FROM activities`
```

### Bot Response Time

- Keep wizard steps quick (< 1 second)
- Use `answerCbQuery()` for callback queries
- Avoid heavy computation in message handlers

See [Code Patterns](/development/patterns.md) for best practices.

## Troubleshooting

### Bot stops responding

1. Check logs: `bun run pod:logs`
2. Verify bot token is valid
3. Ensure database connection is active
4. Restart the bot: `bun run pod:restart`

### Database connection errors

```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Check database exists
psql -U postgres -l | grep activity

# Test connection
psql -U postgres -d activity_challenge_bot -c "SELECT 1"
```

See [Environment Setup](/guide/environment-setup.md) for configuration troubleshooting.

### Port conflicts

If you see "port already in use":

```bash
# Find process using port 3001
lsof -i :3001

# Kill the process
kill -9 <PID>

# Or change the port in .env
echo "API_PORT=3002" >> .env
```

### TypeScript errors

```bash
# Clear Bun cache
rm -rf ~/.bun/install/cache

# Reinstall dependencies
rm -rf node_modules bun.lockb
bun install
```

## Next Steps

- Learn about [Code Patterns](/development/patterns.md) - Bot-specific patterns
- Understand [Testing](/development/testing.md) - Testing strategies
- Explore [Project Structure](/development/project-structure.md) - Code organization
- Review [Architecture Overview](/architecture/overview.md) - System design
- Read [Contributing Guidelines](/CONTRIBUTING) - Contribution process