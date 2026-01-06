---
layout: home

hero:
  name: "Activity Challenge Bot"
  text: "Guild-Based Fitness Competition Platform"
  tagline: A Telegram bot for tracking physical activities and fostering healthy competition among Aalto University guilds.
  actions:
    - theme: brand
      text: Getting Started
      link: /guide/getting-started
    - theme: alt
      text: View Architecture
      link: /architecture/overview

features:
  - title: 🏆 Guild Competition System
    details: Real-time leaderboards tracking guild performance based on average points per member, encouraging broad participation over raw numbers.
  
  - title: 📊 MET-Based Point System
    details: Science-backed point calculation using Metabolic Equivalents (METs) from the 2024 Compendium of Physical Activities, ensuring fair scoring across all activity types.
  
  - title: 🎯 Intuitive Activity Logging
    details: Wizard-based interface guiding users through a 4-level hierarchy of 1000+ activities with intensity levels, making logging quick and accurate.
  
  - title: 📈 Comprehensive Statistics
    details: Personal rankings, guild standings, activity history, and trend analysis with ranking history visualization.
  
  - title: ⚡ High Performance
    details: Built with Bun runtime and PostgreSQL, featuring intelligent caching for guild leaderboards and optimized database queries.
  
  - title: 🔒 Privacy First
    details: Only stores necessary data (Telegram ID, name, guild, points). No location tracking, no sensitive personal information.

---

## What is Activity Challenge Bot?

Activity Challenge Bot is a Telegram-based fitness competition platform designed for Aalto University guilds. It enables guild members to log their physical activities, earn points based on scientific MET values, and compete in friendly inter-guild challenges.

### Key Concepts

**Guilds**: Student organizations or teams that compete against each other. Guild rankings are calculated using **average points per member** to ensure fair competition regardless of guild size.

**MET-Hours**: The point system is based on Metabolic Equivalent of Task (MET) values multiplied by activity duration, providing a scientifically valid way to compare different types of physical activities.

**Competition Periods**: Time-bound challenges (e.g., Q1 2026) with defined start and end dates, allowing for seasonal competitions and fresh starts.

## Quick Links

### For Administrators
- [Competition Setup](/admin/competition-setup) - Configure competition periods and manage guilds
- [Database Operations](/admin/database-operations) - Backup, restore, and maintain the database
- [Monitoring](/admin/monitoring) - Track bot health and usage statistics

### For Developers
- [Getting Started](/guide/getting-started) - Set up your local development environment
- [Architecture Overview](/architecture/overview) - Understand the bot's structure
- [Contributing Guide](/CONTRIBUTING) - Learn how to contribute to the project

### Reference
- [Point System](/reference/point-system) - How points are calculated
- [Activity Hierarchy](/reference/activity-hierarchy) - Browse the complete activity database
- [Configuration](/reference/configuration) - Environment variables and settings

## Technology Stack

- **Runtime**: Bun (fast JavaScript/TypeScript runtime)
- **Database**: PostgreSQL with optimized indexing
- **Bot Framework**: grammY (Telegram Bot API)
- **Deployment**: Kubernetes with Talos Linux (Hetzner Cloud)
- **Web App**: React + Vite + TailwindCSS

## Project Status

This bot was built for the Aalto University community and is currently in active use. The codebase is mature and ready for deployment, with comprehensive testing and production-ready infrastructure configuration.

## License

This project is released under the MIT License. See [LICENSE](https://github.com/AJBogo9/activity-challenge-bot/blob/main/LICENSE) for details.