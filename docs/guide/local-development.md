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

## Next Steps

- Learn about [Code Patterns](/development/patterns.md) - Bot-specific patterns
- Understand [Testing](/development/testing.md) - Testing strategies
- Explore [Project Structure](/development/project-structure.md) - Code organization
- Review [Architecture Overview](/architecture/overview.md) - System design
- Read [Contributing Guidelines](/CONTRIBUTING) - Contribution process