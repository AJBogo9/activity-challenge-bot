import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  BOT_TOKEN: z.string().min(1, 'BOT_TOKEN is required'),
  // Make DATABASE_URL optional since we can use individual vars
  DATABASE_URL: z.string().url('Invalid DATABASE_URL').optional(),
  // Individual PostgreSQL variables (POSTGRES_* naming convention)
  POSTGRES_HOST: z.string().optional(),
  POSTGRES_PORT: z.string().optional(),
  POSTGRES_DB: z.string().optional(),
  POSTGRES_USER: z.string().optional(),
  POSTGRES_PASSWORD: z.string().optional(),
  // Also support standard PG* variables
  PGHOST: z.string().optional(),
  PGPORT: z.string().optional(),
  PGDATABASE: z.string().optional(),
  PGUSER: z.string().optional(),
  PGPASSWORD: z.string().optional(),
}).refine(
  (data) => {
    // Require either DATABASE_URL or at least one individual variable
    const hasPostgresVars = !!(data.POSTGRES_HOST || data.POSTGRES_PORT || data.POSTGRES_DB || data.POSTGRES_USER || data.POSTGRES_PASSWORD);
    const hasPgVars = !!(data.PGHOST || data.PGPORT || data.PGDATABASE || data.PGUSER || data.PGPASSWORD);
    return data.DATABASE_URL || hasPostgresVars || hasPgVars;
  },
  {
    message: 'Either DATABASE_URL or individual PostgreSQL variables (POSTGRES_* or PG*) must be provided',
  }
);

export const config = envSchema.parse(process.env);

// Database configuration
export const dbConfig = {
  connectionString: config.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/activity_challenge_bot',
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
  maxRetries: 10,
  retryDelay: 2000, // 2 seconds
};

// Bot configuration
export const botConfig = {
  token: config.BOT_TOKEN,
  keepAlive: false,
};

// Re-export competition config
export { CURRENT_COMPETITION, isCompetitionActive, getDaysRemaining, getDaysElapsed, getCompetitionProgress } from './competition';
export * from './contributors';
export * from './guilds';