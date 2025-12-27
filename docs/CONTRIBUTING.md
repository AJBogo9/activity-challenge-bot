# Contributing Guide 🎉

Thanks for your interest in contributing to the Activity Challenge Bot! This guide will help you set up your development environment.

## Table of Contents
- [Development Setup](#development-setup)
  - [Prerequisites](#prerequisites)
  - [Step 1: Clone the Repository](#step-1-clone-the-repository)
  - [Step 2: Install Dependencies](#step-2-install-dependencies)
  - [Step 3: Set Up Services with Podman](#step-3-set-up-services-with-podman)
  - [Step 4: Configure Environment Variables](#step-4-configure-environment-variables)
- [Development Workflow](#development-workflow)
  - [Running the Bot](#running-the-bot)
  - [Managing Data](#managing-data)
  - [Database Access](#database-access)
- [Testing](#testing)
- [Contributing Standards](#contributing-standards)

---

## Development Setup

### Prerequisites

Ensure you have the following installed:

- **Bun** (Latest) - [Installation guide](https://bun.sh/docs/installation)
- **Podman** - [Installation guide](https://podman.io/docs/installation)
- **Podman Compose** - Often comes with Podman or can be installed via `pip` or package manager.
- **Git** - For version control.
- **Telegram Account** - For creating and testing your bot instance.

### Step 1: Clone the Repository

```bash
git clone https://github.com/EppuRuotsalainen/activity-challenge-bot.git
cd activity-challenge-bot
```

### Step 2: Install Dependencies

```bash
bun install
```

### Step 3: Set Up Services with Podman

Start the required services (Postgres, Metabase) using Podman Compose:

```bash
bun run pod:up
```

Verify services are running:
```bash
podman ps
```

### Step 4: Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. **Telegram Bot Token**: Create a bot via [@BotFather](https://t.me/BotFather) and paste the token in `.env`.
3. **Admin User ID**: Get your ID via [@userinfobot](https://t.me/userinfobot) and paste it in `ADMIN_USER_ID`.
4. **Database Configuration**: The default values in `.env.example` should work with the Podman setup.

---

## Development Workflow

### Running the Bot

**Local mode (using local Bun):**
```bash
bun dev # Starts with --watch mode
```

**Inside Podman:**
```bash
bun run pod:dev # Rebuilds and starts the bot container
```

### Managing Data

Initialize guilds and populate test data:
```bash
bun run pod:init-guilds
bun run pod:populate
```

To clear data:
```bash
bun run pod:clear
```

### Database Access

To access the Postgres database directly inside the container:
```bash
bun run pod:db:psql
```

---

## Testing

This project uses Bun's native test framework.

```bash
bun test          # Run all tests
bun test:watch    # Run in watch mode
bun test:coverage # Generate coverage report
```

---

## Contributing Standards

1. **Branching**: Create a feature branch: `git checkout -b feature/your-feature`.
2. **Linting**: Run `bun run lint` before committing.
3. **Tests**: Ensure all tests pass and add new ones for your features.
4. **Documentation**: Update the `README.md` or `docs/` if your changes affect usage or setup.
5. **Pull Requests**: Provide a clear description of your changes and why they are needed.

## Resources

- [Telegraf Documentation](https://telegraf.js.org/)
- [Bun Documentation](https://bun.sh/docs)
- [Postgres Documentation](https://www.postgresql.org/docs/)
- [VitePress Documentation](https://vitepress.dev/)



