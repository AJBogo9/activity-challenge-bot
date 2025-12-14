![SummerBodyBot Banner](./assets/banner.svg)

SummerBodyBot is a Telegram bot designed to track and record competition scores among Aalto guilds and within teams. Participants can register, join or create teams, log weekly activities to earn points, and view various rankings and statistics.

## Features

- 🏆 Guild-based competition tracking
- 👥 Team creation and management
- 📊 Real-time leaderboards and statistics
- 🏃 Activity logging (exercise, sports, wellness)
- 📈 Points calculation and ranking system

## Tech Stack

- **Bun** - Runtime environment
- **Telegraf** - Telegram bot framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **Podman** - Containerization
- **Metabase** - Analytics and dashboard

## Quick Start

### For Users
1. Find the bot on Telegram: `@summerbodybot` (or your bot username)
2. Send `/start` to begin
3. Follow the registration flow

### For Developers

Full development setup: [CONTRIBUTING.md](docs/CONTRIBUTING.md)

## Available Commands
```bash
bun start                   # Start the bot
bun run populate            # Add test data
bun run clear               # Remove test data
bun test                    # Run tests
bun run pod:start           # Start the Podman pod
bun run pod:remove          # Remove the Podman pod
bun run pod:populate        # Add test data to the pod
bun run pod:clear           # Remove test data from the pod
```
## Project Structure
```
.
├── index.js                 # Application entry point
├── src/
│   ├── bot.js               # Bot initialization
│   ├── config/              # Configuration and constants
│   ├── flows/               # User interaction flows
│   ├── models/              # Database schemas
│   ├── services/            # Business logic
│   └── utils/               # Helper functions
├── scripts/                 # Development utilities
├── tests/                   # Test files
└── docs/                    # Documentation
```

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](docs/CONTRIBUTING.md) for development setup and guidelines.

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Support

- Report bugs: [GitHub Issues](https://github.com/EppuRuotsalainen/summer-body-bot/issues)