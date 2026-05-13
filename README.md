![Bot Banner](assets/banner.svg)

A Telegram bot for tracking physical activities and fostering healthy competition among Aalto University guilds. Built with Bun, PostgreSQL, and grammY.

## Features

- **Guild Competition System** - Real-time leaderboards based on average points per member
- **MET-Based Scoring** - Science-backed points using the 2024 Compendium of Physical Activities
- **10+ Activities** - Comprehensive 4-level hierarchy from casual walks to competitive sports
- **Rich Statistics** - Personal rankings, guild standings, and activity history
- **High Performance** - Built with Bun runtime and optimized PostgreSQL queries
- **Privacy First** - Only stores necessary data, no location tracking

## Tech Stack

- **Runtime**: Bun (fast JavaScript/TypeScript runtime)
- **Database**: PostgreSQL with postgres.js
- **Bot Framework**: grammY (modern Telegram bot framework)
- **Frontend**: React + Vite + TailwindCSS
- **Deployment**: Kubernetes (Talos Linux) on Hetzner Cloud
- **GitOps**: Flux CD

## Documentation: https://ajbogo9.github.io/activity-challenge-bot/

Comprehensive documentation is available in the `docs/` directory:

- **[Getting Started](docs/guide/getting-started.md)** - Setup and installation
- **[Architecture Overview](docs/architecture/overview.md)** - System design
- **[Competition Setup](docs/admin/competition-setup.md)** - Admin guide
- **[Point System](docs/reference/point-system.md)** - How scoring works
- **[Contributing](CONTRIBUTING.md)** - Development guidelines
