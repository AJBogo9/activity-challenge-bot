import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  BOT_TOKEN: z.string().min(1, 'BOT_TOKEN is required'),
  DATABASE_URL: z.string().url('Invalid DATABASE_URL'),
});

export const config = envSchema.parse(process.env);

// Re-export competition config
export { CURRENT_COMPETITION, isCompetitionActive, getDaysRemaining } from './competition';
export * from './contributors'