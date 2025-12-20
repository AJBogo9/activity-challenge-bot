// src/db/index.ts
import postgres from 'postgres'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not defined in environment variables')
}

// Create postgres connection
export const sql = postgres(process.env.DATABASE_URL, {
  max: 10, // Connection pool size
  idle_timeout: 20,
  connect_timeout: 10,
})

// Helper to close connection (for graceful shutdown)
export const closeDb = async () => {
  await sql.end()
}

// Re-export other database modules for convenience
export * from './users';
export * from './teams';
export * from './activities';
export * from './point-queries';