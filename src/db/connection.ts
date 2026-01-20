import postgres from 'postgres';
import { dbConfig } from '../config';

/**
 * Build connection options from individual environment variables or connection string
 * Supports both POSTGRES_* (custom) and PG* (standard PostgreSQL) variables
 */
function getConnectionOptions(): Parameters<typeof postgres>[0] {
  // Check if individual environment variables are set
  // Support both POSTGRES_* (custom) and PG* (standard) variable names
  const host = process.env.POSTGRES_HOST || process.env.PGHOST;
  const port = process.env.POSTGRES_PORT || process.env.PGPORT;
  const database = process.env.POSTGRES_DB || process.env.PGDATABASE;
  const user = process.env.POSTGRES_USER || process.env.PGUSER;
  const password = process.env.POSTGRES_PASSWORD || process.env.PGPASSWORD;
  
  const hasIndividualVars = Boolean(host || port || database || user || password);

  if (hasIndividualVars) {
    // Use individual environment variables
    // This supports Unix socket authentication when host is a socket path
    console.log('🔧 Using individual PostgreSQL environment variables for connection');
    
    // postgres library recognizes these option names
    return {
      host,
      port: port ? parseInt(port, 10) : undefined,
      database,
      username: user,  // postgres library uses 'username', not 'user'
      password,
    };
  } else {
    // Fall back to connection string from config
    console.log('🔧 Using DATABASE_URL connection string');
    return dbConfig.connectionString;
  }
}

/**
 * Create postgres connection with retry logic
 */
async function createConnection(retries = dbConfig.maxRetries): Promise<ReturnType<typeof postgres>> {
  try {
    const connectionOptions = getConnectionOptions();
    
    // If connectionOptions is a string (connection URL), pass it directly
    // Otherwise it's an object with connection params, merge with config
    const connection = typeof connectionOptions === 'string'
      ? postgres(connectionOptions, {
          max: dbConfig.max,
          idle_timeout: dbConfig.idle_timeout,
          connect_timeout: dbConfig.connect_timeout,
        })
      : postgres({
          ...connectionOptions,
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
      console.log`⏳ Database not ready, retrying in ${dbConfig.retryDelay/1000}s... (${dbConfig.maxRetries - retries + 1}/${dbConfig.maxRetries})`;
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