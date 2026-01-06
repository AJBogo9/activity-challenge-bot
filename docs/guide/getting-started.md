# Getting Started

Welcome to the Activity Challenge Bot development guide! This page will help you set up the project locally and start contributing.

## Prerequisites

Before you begin, ensure you have the following installed:

- **[Bun](https://bun.sh/)** v1.0 or higher - Modern JavaScript runtime
- **[PostgreSQL](https://www.postgresql.org/)** v14 or higher - Database
- **[Podman](https://podman.io/)** or **[Docker](https://www.docker.com/)** - Container runtime (optional, for containerized development)
- **[Git](https://git-scm.com/)** - Version control
- **A Telegram account** - For bot testing

::: tip Runtime Choice
This project uses **Bun** as the runtime instead of Node.js. Bun is a fast, modern JavaScript runtime with built-in TypeScript support, package management, and testing.
:::

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/EppuRuotsalainen/activity-challenge-bot.git
cd activity-challenge-bot
```

### 2. Install Dependencies

```bash
bun install
```

### 3. Set Up Environment Variables

Copy the example environment file and configure it:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Required: Get from @BotFather on Telegram
BOT_TOKEN=your_bot_token_here

# Database (use defaults for local development)
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=activity_challenge_bot
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/activity_challenge_bot

# Optional: For web app features
WEBAPP_URL=http://localhost:5173
API_PORT=3001
```

::: warning Get a Bot Token
You need to create a Telegram bot to get a token:
1. Message [@BotFather](https://t.me/botfather) on Telegram
2. Send `/newbot` and follow the instructions
3. Copy the token and paste it into your `.env` file
:::

### 4. Set Up the Database

#### Option A: Local PostgreSQL

If you have PostgreSQL installed locally:

```bash
# Create the database
createdb activity_challenge_bot

# Run migrations
bun run migrate
```

#### Option B: Containerized Database

Use the provided Docker/Podman compose setup:

```bash
# Start PostgreSQL in a container
bun run pod:up

# Migrations run automatically on container startup
```

### 5. Populate Test Data (Optional)

Add sample data for testing:

```bash
bun run populate
```

This creates:
- Sample users from different guilds
- Test activities with various points
- Realistic competition data

### 6. Start the Bot

```bash
# Development mode with hot reload
bun run dev

# Or production mode
bun run start
```

You should see:

```
✅ Database migrations completed
✅ Bot commands configured
🤖 Bot started successfully!
```

### 7. Test the Bot

1. Open Telegram
2. Find your bot (search for the username you gave it)
3. Send `/start`
4. Register and start logging activities!

## Development Modes

### Local Development (Recommended)

Run the bot directly on your machine with hot reload:

```bash
bun run dev
```

Changes to the code automatically restart the bot.

### Containerized Development

Run the bot in a container with all dependencies:

```bash
# Start all services (bot + database)
bun run pod:dev

# View logs
bun run pod:logs

# Stop services
bun run pod:down
```

### Kubernetes Development

For advanced testing with Kubernetes:

```bash
# Set up local cluster
bun run cluster:setup

# Deploy the bot
bun run cluster:deploy

# View logs
bun run cluster:logs
```

See [Kubernetes Dev Guide](/kubernetes-dev) for details.

## Project Structure Overview

```
activity-challenge-bot/
├── src/
│   ├── bot/              # Bot initialization and setup
│   ├── flows/            # Conversation flows (wizards)
│   ├── db/               # Database queries and migrations
│   ├── config/           # Configuration files
│   └── utils/            # Utility functions
├── scripts/              # Helper scripts
├── data/                 # Activity data (MET values)
├── tests/                # Test files
├── docs/                 # Documentation (VitePress)
└── webapp/               # Web app for statistics
```

See [Project Structure](/development/project-structure) for a detailed walkthrough.

## Common Tasks

### Clear Database

Remove all data but keep the schema:

```bash
bun run clear
```

### Reset and Repopulate

```bash
bun run clear
bun run populate
```

### Run Tests

```bash
# Run all tests
bun test

# Watch mode
bun run test:watch

# With coverage
bun run test:coverage
```

### Lint Code

```bash
bun run lint
```

## Next Steps

Now that you have the bot running locally:

1. **Explore the code** - Start with [Project Structure](/development/project-structure)
2. **Understand flows** - Read [Flows and Wizards](/architecture/flows-and-wizards)
3. **Learn patterns** - Check out [Code Patterns](/development/patterns)
4. **Start contributing** - See [Contributing Guide](/CONTRIBUTING)

## Getting Help

- **Issues**: Check [GitHub Issues](https://github.com/EppuRuotsalainen/activity-challenge-bot/issues)
- **Documentation**: Browse the sidebar for detailed guides
- **Questions**: Open a discussion on GitHub

## Troubleshooting

### Bot token is invalid

Make sure you copied the entire token from BotFather, including any hyphens or colons.

### Database connection failed

Check that PostgreSQL is running and the credentials in `.env` match your database setup.

### Port already in use

If port 3001 is already in use, change `API_PORT` in your `.env` file.

### Migration errors

Try dropping and recreating the database:

```bash
dropdb activity_challenge_bot
createdb activity_challenge_bot
bun run migrate
```