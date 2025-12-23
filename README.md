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
bun test:watch              # Run tests in watch mode
bun test:coverage           # Run tests with coverage report
bun run pod:up              # Start the Podman pod
bun run pod:down            # Remove the Podman pod
bun run pod:populate        # Add test data to the pod
bun run pod:clear           # Remove test data from the pod
```

## Testing

This project uses [Bun's native test framework](https://bun.sh/docs/test/). Tests are located in the `tests/` directory and mirror the structure of `src/`.

### Running Tests

```bash
bun test                    # Run all tests
bun test tests/utils        # Run tests in a specific directory
bun test:watch              # Run tests in watch mode for development
```

### Writing Tests

We use Bun's `test` module which is Jest-compatible. Example:

```typescript
import { describe, expect, test } from "bun:test";
import { myFunction } from "../src/utils/my-function";

describe("myFunction", () => {
  test("should return true", () => {
    expect(myFunction()).toBe(true);
  });
});
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

- Report bugs: [GitHub Issues](https://github.com/EppuRuotsalainen/activity-challenge-bot/issues)