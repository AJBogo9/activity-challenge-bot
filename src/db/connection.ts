import postgres from 'postgres'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not defined in environment variables')
}

const MAX_RETRIES = 10
const RETRY_DELAY = 2000 // 2 seconds

/**
 * Create postgres connection with retry logic
 */
async function createConnection(retries = MAX_RETRIES): Promise<ReturnType<typeof postgres>> {
  try {
    const connection = postgres(process.env.DATABASE_URL!, {
      max: 10,
      idle_timeout: 20,
      connect_timeout: 10,
    })
    
    // Test the connection
    await connection`SELECT 1`
    console.log('✅ Database connected successfully')
    return connection
  } catch (error) {
    if (retries > 0) {
      console.log(`⏳ Database not ready, retrying in ${RETRY_DELAY/1000}s... (${MAX_RETRIES - retries + 1}/${MAX_RETRIES})`)
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY))
      return createConnection(retries - 1)
    }
    
    console.error('❌ Failed to connect to database after maximum retries')
    throw error
  }
}

// Lazy connection
let instance: ReturnType<typeof postgres> | null = null

/**
 * Initialize database connection (call this during startup)
 */
export async function initDb(): Promise<void> {
  if (!instance) {
    instance = await createConnection()
  }
}

/**
 * Close database connection
 */
export async function closeDb(): Promise<void> {
  if (instance) {
    await instance.end()
    instance = null
    console.log('📊 Database connection closed')
  }
}

/**
 * Export sql for direct query access (after initialization)
 * This works exactly like your old code!
 */
export const sql = new Proxy(function() {} as any, {
  get: (target, prop) => {
    if (!instance) {
      throw new Error('Database not initialized! Make sure initDb() is called during startup.')
    }
    return (instance as any)[prop]
  },
  apply: (target, thisArg, args) => {
    if (!instance) {
      throw new Error('Database not initialized! Make sure initDb() is called during startup.')
    }
    // Handle template literal calls: sql`SELECT ...`
    return (instance as any)(...args)
  }
}) as ReturnType<typeof postgres>