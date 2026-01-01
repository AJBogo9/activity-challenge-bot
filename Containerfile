# Use the official Bun image
FROM docker.io/oven/bun:1 AS builder

# Create a working directory inside the container
WORKDIR /app

# Copy package files
COPY package.json bun.lock* ./
COPY webapp/package.json webapp/bun.lock* ./webapp/

# Install all dependencies
RUN bun install
RUN cd webapp && bun install

# Copy source code
COPY . .

# Build webapp
RUN bun run webapp:build

# Production stage
FROM docker.io/oven/bun:1

WORKDIR /app

# Copy dependencies and built files from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/webapp/node_modules ./webapp/node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src ./src
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/data/processed/4_level_hierarchy.json ./data/processed/4_level_hierarchy.json
COPY --from=builder /app/data/contributors.ts ./data/contributors.ts
COPY --from=builder /app/index.ts ./
COPY --from=builder /app/package.json ./

# Specify the API port
EXPOSE 3001

# Command to start the application
CMD ["bun", "index.ts"]
