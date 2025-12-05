# SummerBodyBot

SummerBodyBot is a Telegram bot designed to track and record competition scores among Aalto guilds and within teams. Participants can register, join or create teams, log weekly activities to earn points, and view various rankings and statistics. The bot is free to use and its functionality may be updated or modified at any time.

## Core Stack

- **Node.js** – [nodejs.org](http://nodejs.org/)
- **Telegraf** – [telegraf.js.org](https://telegraf.js.org/#/)
- **MongoDB** – [mongodb.github.io/node-mongodb-native](https://mongodb.github.io/node-mongodb-native/)
- **Docker** – [docs.docker.com](https://docs.docker.com/get-docker/)

## Quick Start

Clone the repository:

```bash
git clone https://github.com/EppuRuotsalainen/summer-body-bot.git
cd summer-body-bot
```

Build the Docker image:

```bash
sudo docker build -t summer-body-bot .
```

Start the server (or run locally):

```bash
sudo docker run -d --name summer-body-bot summer-body-bot
```

Stop the server:

```bash
sudo docker stop summer-body-bot
```

To populate test data or generate statistics PDFs or SVGs, run the provided scripts:

```bash
node populateTestData.js
node generateStatsPDF.js
node generateCharts.js
```

## Project Structure

```
.
├── .github
│   └── workflows
│       └── deploy.yml               # GitHub Actions workflow for automated deployment
├── bot.js                           # Telegram bot initialization and middleware configuration
├── database.js                      # MongoDB connection and disconnection logic
├── deploy-script.sh                 # Shell script to deploy the bot via Docker
├── Dockerfile                       # Docker configuration file
├── package.json                     # Project metadata and dependency definitions
├── config                           # Configuration files and constants
│   ├── constants.js                 # Core constants (env settings, commands, etc.)
│   ├── index.js                     # Consolidated configuration export
│   ├── logger.js                    # Simple logging functions
│   └── multipliers.js               # Point multipliers and activity definitions
├── flows                            # Conversation flows for user interactions
│   ├── adjust-points.js             # Admin flow for adjusting user points
│   ├── create-team.js               # Flow for creating a new team
│   ├── delete-user.js               # Flow for user deletion and cleanup
│   ├── exercise-scores.js           # Flow for logging kilometre‑based or hour‑based exercises
│   ├── index.js                     # Exports all flow scenes for use by the bot
│   ├── join-team.js                 # Flow for joining an existing team
│   ├── register.js                  # Flow for user registration and terms acceptance
│   ├── week-scores.js               # Flow for submitting weekly competition scores
│   ├── information-flows            # Informational flows used in private chats and groups
│   │   ├── help.js                  # Help and commands overview
│   │   ├── how-to-points.js         # Instructions on how to earn points
│   │   ├── start.js                 # Introduction and getting started guide
│   │   ├── stats-info.js            # Overview of statistics and leaderboard commands
│   │   └── terms.js                 # Competition terms and conditions
│   └── statistics-flows             # Flows displaying competition statistics
│       ├── guild-comparison.js      # Detailed guild comparison by averages, totals, and categories
│       ├── guild-standings.js       # Guild standings based on average points
│       ├── team-member-rankings.js  # Rankings of team members for the user's team
│       ├── team-rankings.js         # Team rankings sorted by average points per member
│       ├── top-users.js             # Top 15 participants by total points
│       └── user-summary.js          # Personal points summary for a user
├── populateTestData.js              # Script to generate sample data for testing
├── generateCharts.js                # Script to generate SVG charts of competition statistics
├── generateStatsPDF.js              # Script to produce PDF reports of competition statistics
├── models                           # Mongoose models defining the data schema
│   ├── team-model.js                # Team schema and methods for point aggregation
│   └── user-model.js                # User schema including points, team, and guild information
├── services                         # Business logic for data manipulation
│   ├── point-service.js             # Functions to add, adjust, and aggregate points
│   ├── team-service.js              # Functions to create teams and manage team membership
│   └── user-service.js              # Functions to create, find, delete users and send reminders
├── utils                            # Utility functions and shared code
│   ├── can-add-points.js            # Check if a user can add new points based on submission dates
│   ├── check-private.js             # Ensures certain commands are only used in private chats
│   ├── error-handler.js             # Global error handling and logging
│   ├── exit-on-text.js              # Prompts users to use buttons instead of text replies
│   ├── flow-helpers.js              # Helper functions for interactive inline questions
│   ├── format-list.js               # Utility for formatting lists with padded titles and values
│   ├── is-comp-active.js            # Checks if the competition is currently active
│   ├── schedule-reminders.js        # Schedules weekly reminder messages via node-schedule
│   ├── texts.js                     # Texts and messages used throughout the bot
│   └── validate-team-name.js        # Validates team names for allowed characters and length
└── index.js                         # Application entry point to start the bot and schedule reminders
```