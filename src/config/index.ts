import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  BOT_TOKEN: z.string().min(1, 'BOT_TOKEN is required'),
  DATABASE_URL: z.string().url('Invalid DATABASE_URL'),
});

export const config = envSchema.parse(process.env);

// Database configuration
export const dbConfig = {
  connectionString: config.DATABASE_URL,
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
export * from './guilds'