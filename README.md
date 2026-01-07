![Bot Banner](assets/banner.svg)

A Telegram bot for tracking physical activities and fostering healthy competition among Aalto University guilds. Built with Bun, PostgreSQL, and grammY.



## Features

- 🏆 **Guild Competition System** - Real-time leaderboards based on average points per member
- 📊 **MET-Based Scoring** - Science-backed points using the 2024 Compendium of Physical Activities
- 🎯 **10+ Activities** - Comprehensive 4-level hierarchy from casual walks to competitive sports
- 📈 **Rich Statistics** - Personal rankings, guild standings, and activity history
- ⚡ **High Performance** - Built with Bun runtime and optimized PostgreSQL queries
- 🔒 **Privacy First** - Only stores necessary data, no location tracking

## Quick Start

### Prerequisites

- [Bun](https://bun.sh/) v1.0+
- [PostgreSQL](https://www.postgresql.org/) v14+
- A Telegram Bot Token (get from [@BotFather](https://t.me/botfather))

### Installation

```bash
# Clone the repository
git clone https://github.com/AJBogo9/activity-challenge-bot.git
cd activity-challenge-bot

# Install dependencies
bun install

# Set up environment variables
cp .env.example .env
# Edit .env with your BOT_TOKEN and database credentials

# Start PostgreSQL (if using containers)
bun run pod:up

# Run the bot
bun run dev
```

The bot will automatically run database migrations on startup.

### Using Containers

```bash
# Start bot + database
bun run pod:dev

# View logs
bun run pod:logs

# Stop services
bun run pod:down
```

## Configuration

### Environment Variables

```dotenv
BOT_TOKEN=your_telegram_bot_token
DATABASE_URL=postgresql://user:password@localhost:5432/activity_challenge_bot
NODE_ENV=development
```

### Competition Setup

Edit `src/config/competition.ts`:

```typescript
export const CURRENT_COMPETITION = {
  name: "Winter 2025-2026 Activity Challenge",
  startDate: new Date("2025-12-24"),
  endDate: new Date("2026-03-31"),
  description: "Q1 2026 fitness challenge"
}
```

### Guild Management

Edit `src/config/guilds.ts`:

```typescript
export const GUILDS = [
  { name: "TiK", totalMembers: 700, isActive: true },
  { name: "SIK", totalMembers: 450, isActive: true },
  // Add your guilds here
]
```

## Point System

Points are calculated using MET (Metabolic Equivalent of Task) values:

```
Points = (MET × Duration in minutes) / 60
```

**Example**: Running at 8.0 METs for 30 minutes = 4.0 points

Guilds are ranked by **average points per member** to ensure fair competition regardless of guild size.

## Development

### Available Scripts

```bash
# Development
bun run dev              # Start with hot reload
bun run start            # Production mode

# Testing
bun test                 # Run tests
bun run test:watch       # Watch mode
bun run test:coverage    # With coverage

# Database
bun run populate         # Add test data
bun run clear            # Clear database
bun run pod:db:psql      # Open PostgreSQL shell

# Documentation
bun run docs:dev         # Start docs server
bun run docs:build       # Build docs
```

### Project Structure

```
src/
├── bot/                 # Bot initialization and setup
├── flows/               # Conversation flows (wizards)
│   ├── activity/        # Activity logging (7-step wizard)
│   ├── register/        # User registration
│   ├── profile/         # User profile management
│   └── stats/           # Statistics and leaderboards
├── db/                  # Database operations
├── config/              # Configuration files
└── utils/               # Utility functions

data/
├── raw/                 # Original compendium PDF
└── processed/           # activity-hierarchy.json

docs/                    # VitePress documentation
webapp/                  # React web application
deployment/              # Kubernetes configurations
```

## Architecture

The bot uses several key patterns:

- **Two-Message Manager**: Maintains exactly two persistent messages per user for a clean interface
- **Wizard Pattern**: Multi-step forms for activity logging and registration
- **Scene-Based Navigation**: Organized conversation flows using grammY scenes
- **MET-Based Scoring**: Scientific activity intensity measurements from the 2024 Compendium

See [Architecture Documentation](docs/architecture/overview.md) for details.

## Documentation

Comprehensive documentation is available in the `docs/` directory:

- **[Getting Started](docs/guide/getting-started.md)** - Setup and installation
- **[Architecture Overview](docs/architecture/overview.md)** - System design
- **[Competition Setup](docs/admin/competition-setup.md)** - Admin guide
- **[Point System](docs/reference/point-system.md)** - How scoring works
- **[Contributing](CONTRIBUTING.md)** - Development guidelines

View the full documentation site:

```bash
bun run docs:dev
```

## Deployment

The bot supports multiple deployment options:

### Local Development
```bash
bun run dev
```

### Docker/Podman
```bash
bun run pod:up
```

### Kubernetes
```bash
bun run cluster:setup
bun run cluster:deploy
```

See [deployment documentation](docs/guide/kubernetes-dev.md) for Kubernetes setup with Talos Linux.

## Testing

```bash
# Run all tests
bun test

# Watch mode
bun run test:watch

# With coverage
bun run test:coverage
```

The test suite covers:
- Point calculations
- Ranking algorithms
- Database operations
- User flows

## Contributing

Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## Tech Stack

- **Runtime**: Bun (fast JavaScript/TypeScript runtime)
- **Database**: PostgreSQL with postgres.js
- **Bot Framework**: grammY (modern Telegram bot framework)
- **Frontend**: React + Vite + TailwindCSS
- **Deployment**: Kubernetes (Talos Linux) on Hetzner Cloud
- **GitOps**: Flux CD

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- **Documentation**: [Full docs](docs/)
- **Issues**: [GitHub Issues](https://github.com/AJBogo9/activity-challenge-bot/issues)
- **Questions**: Open a discussion on GitHub