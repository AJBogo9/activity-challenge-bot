Thanks for your intrest in contributing! 🎉

# Table of Contents
- [Table of Contents](#table-of-contents)
- [Developement Setup](#developement-setup)
  - [Prerequisites](#prerequisites)
  - [Step 1: Clone the Repository](#step-1-clone-the-repository)
  - [Step 2: Install Dependencies](#step-2-install-dependencies)
  - [Step 3: Set Up MongoDB with Docker](#step-3-set-up-mongodb-with-docker)
  - [Step 4: Configure Environment Variables](#step-4-configure-environment-variables)
- [Optional Setup](#optional-setup)
  - [Populate Test Data](#populate-test-data)
  - [Set Up MongoDB Compass](#set-up-mongodb-compass)
  - [Set Up Metabase](#set-up-metabase)
- [Development Workflow](#development-workflow)
  - [Start MongoDB container](#start-mongodb-container)
  - [Start the Bot](#start-the-bot)
- [Contributing](#contributing)
  - [Making Changes](#making-changes)
  - [Code Standards](#code-standards)
  - [Questions and Feedback](#questions-and-feedback)
  - [Resources](#resources)


# Developement Setup

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js)
- **Docker** - [Installation guide](https://docs.docker.com/engine/install/)
- **Git** - For version control
- **Telegram Account** - For creating and testing the bot

## Step 1: Clone the Repository

## Step 2: Install Dependencies
```bash
npm install
```

## Step 3: Set Up MongoDB with Docker

Start a MongoDB container:
```bash
docker run -d \
  --name mongodb \
  -p 127.0.0.1:27017:27017 \
  -v mongodb_data:/data/db \
  mongo:latest
```

Verify MongoDB is running:
```bash
docker ps
```

You should see the `mongodb` container in the list.

## Step 4: Configure Environment Variables

Create a `.env` file in the root directory and copy the `.env.example` contents to the env file.

**Step 4.1: Create Your Telegram Bot**

1. Open Telegram and search for `@BotFather`
2. Send `/newbot` to create a new bot
3. Choose a name for your bot (e.g., "SummerBody Dev Bot")
4. Choose a username ending in 'bot' (e.g., "summerbody_dev_bot")
5. **Copy the bot token** that BotFather provides to the `.env` file

**Step 4.2: Get Your Telegram User ID**

1. In Telegram, search for `@userinfobot`
2. Send `/start` to the bot
3. **Copy your user ID number** to the `.env` file

# Optional Setup

## Populate Test Data

To test the bot with sample data:
```bash
npm run populate
```

## Set Up MongoDB Compass

MongoDB Compass is a GUI tool for visualizing and analyzing your database schema.

## Set Up Metabase

Credentials
```
Email: admin@summerbodybot.com
Password: password67
```



# Development Workflow

## Start MongoDB container
```bash
docker start mongodb
```

## Start the Bot
```bash
npm start
```

You should see output like:
```
Bot started
```

# Contributing

## Making Changes

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make your changes and test them
3. Commit with clear messages
4. Push and open a Pull request

## Code Standards

- Test features throughtly before creating pull requests
- Update documentation if needed

## Questions and Feedback

- **Issues**: Report bugs or request features via [GitHub Issues](https://github.com/EppuRuotsalainen/summer-body-bot/issues)
- **Contact**: Reach out to the maintainers for sensitive questions

## Resources

- [Telegraf Documentation](https://telegraf.js.org/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Node.js Documentation](https://nodejs.org/docs/)
- [Telegram Bot API](https://core.telegram.org/bots/api)
- [Metabase Documentation](https://www.metabase.com/docs/latest/)



