![SummerBodyBot Banner](./assets/banner.svg)

SummerBodyBot is a Telegram bot designed to track and record activity scores among Aalto guilds and within teams. Participants can register, join or create teams, log activities to earn points, and view various rankings and statistics via the bot.

## Features

- 🏆 **Guild-based competition tracking**: Compete for your guild's glory.
- 👥 **Team management**: Create or join teams to compete with friends.
- 📊 **Real-time leaderboards**: Track your progress and rankings instantly.
- 🏃 **Activity logging**: Log exercise and wellness activities with ease.
- 🛠️ **Administrative tools**: Scripts for managing guilds and test data.

## Tech Stack

- **Bun** - Fast JavaScript/TypeScript runtime
- **Telegraf** - Modern Telegram bot framework
- **Postgres** - Relational database for persistent storage
- **Podman** - Containerization for easy deployment
- **VitePress** - Documentation site generator

## Quick Start

### For Users
1. Find the bot on Telegram: `@summerbodybot` (or your bot username)
2. Send `/start` to begin
3. Follow the registration flow

### For Developers

For detailed setup instructions, see the [CONTRIBUTING.md](docs/CONTRIBUTING.md) and the [Documentation](https://eppuruotsalainen.github.io/activity-challenge-bot/).

## Available Commands

### Local Development
```bash
bun start                   # Start the bot
bun dev                     # Start the bot in watch mode
bun test                    # Run tests
bun test:watch              # Run tests in watch mode
bun test:coverage           # Run tests with coverage report
bun run lint                # Run ESLint
```

### Podman Operations
```bash
bun run pod:up              # Start the Podman pod (detached)
bun run pod:down            # Stop and remove the Podman pod
bun run pod:dev             # Start the Podman pod in foreground
bun run pod:logs            # View bot logs in the pod
bun run pod:shell           # Open a shell in the bot container
```

### Data Management
```bash
bun run populate            # Add test data locally
bun run clear               # Remove local test data
bun run pod:populate        # Add test data to the pod
bun run pod:clear           # Remove test data from the pod
bun run pod:init-guilds     # Initialize guilds in the pod
```

### Documentation
```bash
bun run docs:dev            # Start  dev server
bun run docs:build          # Build VitePress documentation
```

## Project Structure

```
.
├── index.ts                 # Application entry point
├── src/
│   ├── bot/                 # Bot initialization and middleware
│   ├── db/                  # Database queries and schema (Postgres)
│   ├── flows/               # User interaction flows (Wizards/Scenes)
│   ├── constants.ts         # Global constants
│   ├── types/               # TypeScript definitions
│   └── utils/               # Helper functions
├── scripts/                 # Maintenance and data scripts
├── tests/                   # Test files (Bun Test)
├── docs/                    # Documentation (VitePress)
└── compose.yaml             # Podman/Docker Compose configuration
```

## Testing

This project uses [Bun's native test framework](https://bun.sh/docs/test/).

```bash
bun test                    # Run all tests
bun test tests/utils        # Run tests in a specific directory
```

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](docs/CONTRIBUTING.md) for development setup and guidelines.

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Support

- Report bugs: [GitHub Issues](https://github.com/EppuRuotsalainen/activity-challenge-bot/issues)