# Use the official Bun image
FROM docker.io/oven/bun:1

# Create a working directory inside the container
WORKDIR /app

# Copy package.json to install dependencies
COPY package.json ./

# Install dependencies using Bun
RUN bun install

# Copy source code
COPY . .

# Specify the port
EXPOSE 3000

# Command to start the application
CMD [ "bun", "index.js" ]
