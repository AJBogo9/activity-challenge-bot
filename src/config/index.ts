import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  BOT_TOKEN: z.string().min(1, 'BOT_TOKEN is required'),
  DATABASE_URL: z.string().url('Invalid DATABASE_URL'),
  POSTGRES_USER: z.string().default('postgres'),
  POSTGRES_PASSWORD: z.string().min(1, 'POSTGRES_PASSWORD is required'),
  POSTGRES_DB: z.string().default('activity_challenge_bot'),
  POSTGRES_HOST: z.string().default('localhost'),
  POSTGRES_PORT: z.string().default('5432'),
  METABASE_DB_PASSWORD: z.string().min(1, 'METABASE_DB_PASSWORD is required'),
  MB_ENCRYPTION_SECRET_KEY: z.string().min(1, 'MB_ENCRYPTION_SECRET_KEY is required'),
});

export const config = envSchema.parse(process.env);

// Re-export competition config
export { CURRENT_COMPETITION, isCompetitionActive, getDaysRemaining } from './competition';

export * from './contributors'