# Project Structure

This guide provides a detailed walkthrough of the codebase structure and what each directory contains.

## Overview

```
activity-challenge-bot/
├── src/                  # Source code
├── scripts/              # Utility scripts
├── data/                 # Activity data files
├── tests/                # Test files
├── docs/                 # Documentation (VitePress)
├── webapp/               # Web application (React)
├── deployment/           # Deployment configurations
├── index.ts              # Entry point
└── package.json          # Dependencies and scripts
```

## Source Code (`src/`)

### Bot Module (`src/bot/`)

Core bot initialization and configuration.

```
src/bot/
├── instance.ts           # Bot instance creation
├── setup.ts              # Command setup and configuration
├── start.ts              # Bot startup logic
├── commands.ts           # Command handlers
├── middleware.ts         # Global middleware
└── handlers/
    ├── handlers.ts       # Message and callback handlers
    └── inlineQueryHandler.ts  # Inline query handling
```

**Key Files**:
- `instance.ts`: Creates the Telegraf bot instance
- `setup.ts`: Configures bot commands and menu
- `start.ts`: Orchestrates bot startup, database migration, and error handling
- `commands.ts`: Handles all bot commands (`/start`, etc.)

### Flows Module (`src/flows/`)

Conversation flows organized by feature.

```
src/flows/
├── activity/             # Activity logging wizard
│   ├── wizard.ts         # Main wizard definition
│   ├── steps/            # Individual wizard steps
│   │   ├── 1-category.ts
│   │   ├── 2-subcategory.ts
│   │   ├── 3-activity.ts
│   │   ├── 4-intensity.ts
│   │   ├── 5-date.ts
│   │   ├── 6-duration.ts
│   │   └── 7-confirm.ts
│   └── helpers/
│       ├── activity-data.ts   # Activity hierarchy access
│       └── navigation.ts      # Navigation helpers
├── register/             # User registration wizard
│   ├── wizard.ts
│   ├── steps/
│   │   ├── 1-terms.ts    # Terms and conditions
│   │   ├── 2-guild.ts    # Guild selection
│   │   └── 3-confirm.ts  # Confirmation
│   └── helpers/
│       ├── format.ts         # Text formatting
│       └── keyboard-builder.ts  # Keyboard generation
├── menu/                 # Main menu system
│   ├── menu-router.ts    # Menu routing logic
│   ├── registered-menu.ts
│   └── unregistered-menu.ts
├── profile/              # User profile features
│   ├── profile-menu.ts
│   ├── user-profile-info.ts
│   ├── activity-history.ts
│   └── delete.ts         # Account deletion
├── stats/                # Statistics and rankings
│   ├── stats-menu.ts
│   └── index.ts
├── info/                 # Information pages
│   ├── info-menu.ts
│   ├── about.ts
│   ├── credits.ts
│   ├── points.ts
│   └── terms.ts
├── feedback.ts           # Feedback collection
└── index.ts              # Flow exports
```

**Flow Organization**:
- Each major feature has its own directory
- Wizards are multi-step conversation flows
- Menus are single-step navigation interfaces
- Helpers contain shared logic

### Database Module (`src/db/`)

All database operations.

```
src/db/
├── connection.ts         # PostgreSQL connection
├── schema.sql            # Database schema
├── migrate.ts            # Migration runner
├── users.ts              # User queries
├── activities.ts         # Activity queries
├── points.ts             # Point calculations
├── guilds.ts             # Guild queries
├── feedback.ts           # Feedback queries
└── index.ts              # Database exports
```

**Database Functions**:
- `users.ts`: CRUD operations for users
- `activities.ts`: Activity logging and retrieval
- `points.ts`: Point calculation and updates
- `guilds.ts`: Guild standings and statistics

Example from `users.ts`:

```typescript
export async function createUser(data: CreateUserData) {
  return await sql`
    INSERT INTO users (telegram_id, username, first_name, last_name, guild)
    VALUES (${data.telegramId}, ${data.username}, ${data.firstName}, 
            ${data.lastName}, ${data.guild})
    RETURNING *
  `
}
```

### Configuration (`src/config/`)

Application configuration files.

```
src/config/
├── competition.ts        # Competition dates and settings
├── guilds.ts             # Guild definitions
├── contributors.ts       # Project contributors
└── index.ts              # Config exports
```

**Configuration Files**:
- `competition.ts`: Current competition period, date validation
- `guilds.ts`: List of guilds with short/full names
- `contributors.ts`: Credits for the about page

### Utilities (`src/utils/`)

Shared utility functions.

```
src/utils/
├── two-message-manager.ts    # Two-message UX pattern
├── calendar.ts               # Date selection helpers
├── format-list.ts            # Text formatting
├── texts.ts                  # Text content and messages
├── webapp-auth.ts            # Web app authentication
└── index.ts                  # Utility exports
```

**Key Utilities**:
- `two-message-manager.ts`: Manages the "question + answer" UX pattern
- `calendar.ts`: Creates date selection keyboards
- `texts.ts`: Centralized text strings and messages

### Types (`src/types/`)

TypeScript type definitions.

```
src/types/
└── index.ts              # All type definitions
```

Contains interfaces for:
- User data structures
- Activity data structures
- Wizard states
- API responses

### API Server (`src/api/`)

Web app backend API.

```
src/api/
└── server.ts             # Express API server
```

Provides endpoints for:
- User statistics
- Guild rankings
- Activity history
- Authentication

## Scripts Directory (`scripts/`)

Utility scripts for database management and development.

```
scripts/
├── populateTestData.ts   # Add sample data
├── clear.ts              # Clear database
├── init-guilds.ts        # Initialize guild data
├── setup-local-cluster.ts    # Kubernetes setup
├── deploy-local.ts       # Deploy to local K8s
├── destroy-local.ts      # Destroy local K8s
└── pdf-to-json.py        # Process activity data
```

**Common Scripts**:
- `populateTestData.ts`: Creates realistic test data
- `clear.ts`: Removes all data while keeping schema
- `init-guilds.ts`: Ensures all guilds exist in database

Run with:

```bash
bun scripts/populateTestData.ts
# or
bun run populate
```

## Data Directory (`data/`)

Activity data files (MET values from Compendium of Physical Activities).

```
data/
├── raw/
│   └── compendium-2024.pdf   # Original source data
└── processed/
    └── activity-hierarchy.json  # Structured activity data
```

**Data Structure**:

```json
{
  "Sports": {
    "Running": {
      "General running": {
        "Moderate (5 mph)": [{
          "met_value": 8.3,
          "examples": "General running"
        }]
      }
    }
  }
}
```

Four levels: Category → Subcategory → Activity → Intensity

## Tests Directory (`tests/`)

Test files using Bun's built-in test runner.

```
tests/
├── leaderboard.test.ts   # Leaderboard logic tests
└── ranking.test.ts       # Ranking calculation tests
```

Run tests:

```bash
bun test
```

## Documentation (`docs/`)

VitePress documentation (what you're reading now!).

```
docs/
├── .vitepress/
│   └── config.ts         # VitePress configuration
├── index.md              # Home page
├── features.md           # Feature list
├── architecture/         # Architecture docs
├── reference/            # Reference docs
├── guide/                # User guides
├── development/          # Developer guides
└── admin/                # Admin guides
```

## Web App (`webapp/`)

React-based web application for viewing statistics.

```
webapp/
├── src/
│   ├── App.tsx           # Main application
│   ├── pages/            # Page components
│   ├── components/       # Reusable components
│   ├── hooks/            # Custom React hooks
│   └── api.ts            # API client
├── index.html
├── vite.config.ts        # Vite configuration
└── package.json          # Web app dependencies
```

**Not fully documented here** - DOCUMENTATION COMING SOON!.

## Deployment (`deployment/`)

Deployment configurations for different environments.

```
deployment/
├── clusters/
│   ├── hetzner-bot/      # Production cluster config
│   └── local-dev/        # Local Kubernetes config
├── infrastructure/
│   ├── apps/             # Application manifests
│   └── core/             # Core infrastructure
└── modules/              # Terraform modules
```

**Not fully documented here** - deployment is handled by your friend.

## Root Files

### index.ts

Entry point for the application.

```typescript
import 'dotenv/config'
import { startBot } from './src/bot/start'

startBot()
```

### package.json

Defines dependencies, scripts, and project metadata.

See [Local Development](/guide/local-development) for script documentation.

### Configuration Files

- `tsconfig.json` - TypeScript compiler configuration
- `eslint.config.mjs` - ESLint linting rules
- `compose.yaml` - Docker/Podman compose configuration
- `compose.dev.yaml` - Development-specific compose overrides
- `Containerfile` - Container image definition

## Finding Code

### To Find User Interface Code

Look in `src/flows/`. Each feature has its own directory.

### To Find Database Operations

Look in `src/db/`. Functions are organized by entity (users, activities, guilds).

### To Find Configuration

Look in `src/config/`. All configuration is centralized here.

### To Find Business Logic

Look in:
- `src/db/points.ts` for point calculations
- `src/flows/activity/helpers/activity-data.ts` for activity data
- `src/utils/` for shared utilities

### To Find Bot Setup

Look in `src/bot/`:
- `instance.ts` for bot creation
- `setup.ts` for command configuration
- `start.ts` for startup logic

## Next Steps

- Learn about [Testing](/development/testing)
- Read [Architecture Overview](/architecture/overview)
- Explore [Flows and Wizards](/architecture/flows-and-wizards)