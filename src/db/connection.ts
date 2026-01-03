import postgres from 'postgres';
import { dbConfig } from '../config';

/**
 * Create postgres connection with retry logic
 */
async function createConnection(retries = dbConfig.maxRetries): Promise<ReturnType<typeof postgres>> {
  try {
    const connection = postgres(dbConfig.connectionString, {
      max: dbConfig.max,
      idle_timeout: dbConfig.idle_timeout,
      connect_timeout: dbConfig.connect_timeout,
    });

    // Test the connection
    await connection`SELECT 1`;
    console.log('✅ Database connected successfully');
    return connection;
  } catch (error) {
    if (retries > 0) {
      console.log(`⏳ Database not ready, retrying in ${dbConfig.retryDelay/1000}s... (${dbConfig.maxRetries - retries + 1}/${dbConfig.maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, dbConfig.retryDelay));
      return createConnection(retries - 1);
    }
    console.error('❌ Failed to connect to database after maximum retries');
    throw error;
  }
}

// Lazy connection
let instance: ReturnType<typeof postgres> | null = null;

/**
 * Initialize database connection (call this during startup)
 */
export async function initDb(): Promise<void> {
  if (!instance) {
    instance = await createConnection();
  }
}

/**
 * Close database connection
 */
export async function closeDb(): Promise<void> {
  if (instance) {
    await instance.end();
    instance = null;
    console.log('📊 Database connection closed');
  }
}

/**
 * Export sql for direct query access (after initialization)
 */
export const sql = new Proxy(function() {} as any, {
  get: (target, prop) => {
    if (!instance) {
      throw new Error('Database not initialized! Make sure initDb() is called during startup.');
    }
    return (instance as any)[prop];
  },
  apply: (target, thisArg, args) => {
    if (!instance) {
      throw new Error('Database not initialized! Make sure initDb() is called during startup.');
    }
    return (instance as any)(...args);
  }
}) as ReturnType<typeof postgres>;