# Use the official Bun image
FROM docker.io/oven/bun:1

# Create a working directory inside the container
WORKDIR /app

# Copy package.json to install dependencies
COPY package.json bun.lockb* ./

# Install dependencies using Bun
RUN bun install

# Copy source code
COPY . .

# Specify the port (not really needed for Telegram bot, but keeping it)
EXPOSE 3000

# Command to start the application (will be overridden by compose)
CMD ["bun", "index.ts"]