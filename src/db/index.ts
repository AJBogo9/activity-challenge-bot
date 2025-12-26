// src/db/index.ts
import postgres from 'postgres'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not defined in environment variables')
}

const MAX_RETRIES = 10
const RETRY_DELAY = 2000 // 2 seconds

/**
 * Create postgres connection with retry logic
 * Useful for handling startup race conditions when database isn't ready yet
 */
async function createDatabaseConnection(retries = MAX_RETRIES): Promise<ReturnType<typeof postgres>> {
  try {
    const connection = postgres(process.env.DATABASE_URL!, {
      max: 10, // Connection pool size
      idle_timeout: 20,
      connect_timeout: 10,
    })
    
    // Test the connection
    await connection`SELECT 1`
    console.log('✅ Database connected successfully')
    return connection
  } catch (error) {
    if (retries > 0) {
      console.log(`⏳ Database not ready, retrying in ${RETRY_DELAY/1000}s... (attempt ${MAX_RETRIES - retries + 1}/${MAX_RETRIES})`)
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY))
      return createDatabaseConnection(retries - 1)
    }
    console.error('❌ Failed to connect to database after maximum retries')
    throw error
  }
}

// Create postgres connection with retry logic
export const sql = await createDatabaseConnection()

// Helper to close connection (for graceful shutdown)
export const closeDb = async () => {
  await sql.end()
}

// Re-export other database modules for convenience
export * from './users'
export * from './activities'
export * from './point-queries'