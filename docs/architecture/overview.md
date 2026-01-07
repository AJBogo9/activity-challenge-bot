# Architecture Overview

A comprehensive guide to the Activity Challenge Bot's architecture, design patterns, and technical decisions.

## System Architecture

```mermaid
graph TB
  TG[Telegram API]
  
  subgraph Bot["Bot Application"]
    GR[grammY Framework]
    SC[Scenes & Wizards]
    API[API Server]
    TMM[Two-Message Manager Pattern]
    
    GR --> SC
    GR --> API
    SC --> TMM
  end
  
  subgraph DB["PostgreSQL Database"]
    USERS[(users)]
    ACTIVITIES[(activities)]
    FEEDBACK[(feedback)]
  end
  
  WEB[Web Application<br/>React + Vite + TailwindCSS<br/>Stats & Visualizations]
  
  TG --> Bot
  Bot --> DB
  API -.-> WEB

  classDef database fill:#4a90e2,stroke:#2e5c8a,color:#fff
  classDef webapp fill:#10b981,stroke:#059669,color:#fff
  classDef telegram fill:#0088cc,stroke:#006699,color:#fff
  
  class USERS,ACTIVITIES,FEEDBACK database
  class WEB webapp
  class TG telegram
```

## Technology Stack

### Runtime & Language
- **Bun**: Fast JavaScript/TypeScript runtime with built-in bundler
- **TypeScript**: Type-safe development with full IDE support
- **Node.js Compatibility**: Can also run on Node.js if needed

### Bot Framework
- **grammY (Telegraf)**: Modern Telegram bot framework
  - Scene management for multi-step conversations
  - Wizard pattern for form-like flows
  - Middleware architecture
  - Inline keyboard support

### Database
- **PostgreSQL**: Robust relational database
- **postgres.js**: Lightweight PostgreSQL client for Bun/Node
- **SQL**: Direct SQL queries (no ORM) for performance and simplicity

See [Database Architecture](./database.md) for schema details.

### Frontend (Web App)
- **React 18**: UI framework
- **Vite**: Build tool and dev server
- **TailwindCSS**: Utility-first styling
- **Recharts**: Data visualization

### Infrastructure
- **Podman/Docker**: Container runtime
- **Kubernetes**: Production orchestration (Talos Linux)
- **Hetzner Cloud**: Hosting provider
- **Flux CD**: GitOps continuous deployment

## Core Design Patterns

### 1. Two-Message Manager Pattern

The bot maintains exactly two persistent messages per user: a content message (edited in place) and a keyboard message (stays at bottom).

**Benefits:**
- Clean, organized chat interface
- No message spam or clutter
- Consistent user experience
- Easy navigation without scrolling

See [Two-Message Manager](./two-message-manager.md) for complete implementation details.

### 2. Wizard Pattern (Multi-Step Flows)

Complex user interactions use wizards:
- Registration (3 steps)
- Activity logging (7 steps)
- Feedback collection (1 step with multi-part form)

Each wizard step displays information, waits for input, validates, stores state, and proceeds to next step.

See [Flows and Wizards](./flows-and-wizards.md) for detailed flow diagrams and implementation.

### 3. Scene-Based Navigation

The bot uses scenes for different "screens":
- `menu_router`: Determines registered vs unregistered menu
- `registered_menu`: Main menu for registered users
- `unregistered_menu`: Menu for new users
- `activity_wizard`: Activity logging flow
- `register_wizard`: Registration flow
- `profile`: User profile view
- `stats_menu`: Statistics and leaderboards
- `info_menu`: Information and help
- `feedback_wizard`: Feedback collection

### 4. Inline Keyboard Navigation

All user interactions use inline keyboards (buttons within messages):
- No typing required for navigation
- Visual, tap-friendly interface
- Callback data for action handling
- Back/Cancel buttons on every step

### 5. Hierarchical Data Navigation

The 4-level activity hierarchy uses progressive disclosure (Category → Subcategory → Activity → Intensity). Each level is paginated if needed, showing 8-12 items per page.

See [Activity Hierarchy](/reference/activity-hierarchy.md) for complete structure.

## Project Structure

```
src/
├── api/                    # REST API server (for web app)
├── bot/                    # Telegram bot core
├── config/                 # Configuration files
├── db/                     # Database layer
├── flows/                  # Scene implementations
├── types/                  # TypeScript type definitions
└── utils/                  # Utility functions
```

See [Project Structure](/development/project-structure.md) for detailed breakdown.

## Performance Optimizations

### Guild Leaderboard Caching
5-minute in-memory cache, invalidated on activity submission.

### Database Indexing
Strategic indexes for common queries: user lookup, rankings, user history, recent activities.

See [Database Schema](./database.md) for index details.

### Window Functions for Rankings
```sql
-- Efficient ranking without subqueries
SELECT *, RANK() OVER (ORDER BY points DESC) as rank
FROM users
```

## Deployment Architecture

### Development
- Local Docker Compose setup
- PostgreSQL container
- Bot container with hot reload

See [Local Development](/guide/local-development.md) for setup.

### Production
- Kubernetes cluster (Talos Linux)
- PostgreSQL StatefulSet with persistent storage
- Bot Deployment with rolling updates
- Web app served via static hosting
- Flux CD for GitOps

See [Kubernetes Dev Guide](/guide/kubernetes-dev.md) for cluster setup.

## Configuration Management

### Environment Variables
See [Environment Setup](/guide/environment-setup.md) for complete configuration reference.

### Application Configuration
- **Competition dates**: See [Competition Setup](/admin/competition-setup.md)
- **Guild settings**: See [Guild Management](/admin/guild-management.md)

Configuration in code allows version control and type safety.

## Further Reading

### Architecture Deep Dives
- [Database Schema](./database.md) - Complete schema and design decisions
- [Flows and Wizards](./flows-and-wizards.md) - Conversation flow implementation
- [Two-Message Manager](./two-message-manager.md) - Core UX pattern

### Administration
- [Competition Setup](/admin/competition-setup.md) - Configure competition periods
- [Guild Management](/admin/guild-management.md) - Manage guilds

### Development
- [Getting Started](/guide/getting-started.md) - Setup and first run
- [Local Development](/guide/local-development.md) - Development workflow
- [Project Structure](/development/project-structure.md) - Code organization
- [Testing](/development/testing.md) - Testing guide

### Reference
- [Point System](/reference/point-system.md) - How points are calculated
- [Activity Hierarchy](/reference/activity-hierarchy.md) - Complete activity database