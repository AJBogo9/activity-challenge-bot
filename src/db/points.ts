import { sql } from './index'
import { User } from '../types'

/**
 * Add points to a user
 */
export async function addPointsToUser(userId: number, pointsToAdd: number): Promise<void> {
  await sql`
    UPDATE users 
    SET points = points + ${pointsToAdd}
    WHERE id = ${userId}
  `
}

/**
 * Get user's point summary including rankings
 */
export async function getUserSummary(telegramId: string) {
  const [user] = await sql<any[]>`
    WITH global_stats AS (
      SELECT 
        telegram_id,
        RANK() OVER (ORDER BY points DESC) as global_rank,
        COUNT(*) OVER () as total_users
      FROM users
    ),
    guild_stats AS (
      SELECT 
        telegram_id,
        RANK() OVER (PARTITION BY guild ORDER BY points DESC) as guild_rank,
        COUNT(*) OVER (PARTITION BY guild) as guild_users
      FROM users
      WHERE guild IS NOT NULL
    )
    SELECT 
      u.points,
      u.first_name,
      u.username,
      u.guild,
      gs.global_rank,
      gs.total_users,
      gus.guild_rank,
      gus.guild_users
    FROM users u
    LEFT JOIN global_stats gs ON u.telegram_id = gs.telegram_id
    LEFT JOIN guild_stats gus ON u.telegram_id = gus.telegram_id
    WHERE u.telegram_id = ${telegramId}
  `
  return user
}

/**
 * Get guild leaderboard
 * Ordered by average points per member
 */
export async function getGuildLeaderboard() {
  return await sql`
    SELECT 
      g.name as guild,
      COUNT(u.id)::FLOAT as active_members,
      g.total_members::FLOAT as total_members,
      ROUND(COUNT(u.id)::DECIMAL / g.total_members * 100, 1)::FLOAT as participation_percentage,
      SUM(COALESCE(u.points, 0))::FLOAT as total_points,
      ROUND(SUM(COALESCE(u.points, 0)) / CAST(g.total_members AS DECIMAL), 1)::FLOAT as average_points
    FROM guilds g
    LEFT JOIN users u ON g.name = u.guild
    WHERE g.is_active = TRUE
    GROUP BY g.name, g.total_members
    ORDER BY average_points DESC
  `
}

/**
 * Get overall top users
 */
export async function getTopUsers(limit: number = 20): Promise<User[]> {
  return await sql<User[]>`
    SELECT * FROM users
    ORDER BY points DESC
    LIMIT ${limit}
  `
}

/**
 * Get users nearby in global leaderboard
 */
export async function getNearbyUsers(telegramId: string) {
  return await sql<any[]>`
    WITH ranked_users AS (
      SELECT 
        telegram_id,
        username,
        first_name,
        points,
        guild,
        RANK() OVER (ORDER BY points DESC) as rank
      FROM users
    ),
    target_rank AS (
      SELECT rank FROM ranked_users WHERE telegram_id = ${telegramId}
    )
    SELECT * FROM ranked_users
    WHERE ABS(rank - (SELECT rank FROM target_rank)) <= 2
    ORDER BY rank
  `
}

/**
 * Get ranking history for the last N days
 */
export async function getUserRankingHistory(telegramId: string, days: number = 30) {
  return await sql`
    WITH RECURSIVE dates AS (
      SELECT CURRENT_DATE - (${days} || ' days')::INTERVAL as date
      UNION ALL
      SELECT date + '1 day'::INTERVAL
      FROM dates
      WHERE date < CURRENT_DATE
    ),
    daily_points AS (
      SELECT 
        u.telegram_id,
        d.date::DATE,
        SUM(COALESCE(a.points, 0)) as points
      FROM users u
      CROSS JOIN dates d
      LEFT JOIN activities a ON u.id = a.user_id AND a.activity_date <= d.date
      GROUP BY u.telegram_id, d.date
    ),
    daily_ranks AS (
      SELECT 
        telegram_id,
        date,
        points,
        RANK() OVER (PARTITION BY date ORDER BY points DESC) as rank
      FROM daily_points
    )
  SELECT 
    date::TEXT as date,
    rank::INTEGER as rank,
    points::FLOAT as points
  FROM daily_ranks
  WHERE telegram_id = ${telegramId}
  ORDER BY date ASC
  `
}

/**
 * Get ranking history for all guilds for the last N days
 */
export async function getGuildRankingHistory(days: number = 30) {
  return await sql`
    WITH RECURSIVE dates AS (
      SELECT (CURRENT_DATE - (${days} || ' days')::INTERVAL)::DATE as date
      UNION ALL
      SELECT (date + '1 day'::INTERVAL)::DATE
      FROM dates
      WHERE date < CURRENT_DATE
    ),
    daily_guild_points AS (
      SELECT 
        g.name as guild,
        d.date,
        COALESCE(SUM(a.points), 0) / CAST(g.total_members AS DECIMAL) as average_points
      FROM guilds g
      CROSS JOIN dates d
      LEFT JOIN users u ON g.name = u.guild
      LEFT JOIN activities a ON u.id = a.user_id AND a.activity_date <= d.date
      WHERE g.is_active = TRUE
      GROUP BY g.name, d.date, g.total_members
    ),
    daily_guild_ranks AS (
      SELECT 
        guild,
        date,
        average_points,
        RANK() OVER (PARTITION BY date ORDER BY average_points DESC) as rank
      FROM daily_guild_points
    )
    SELECT 
      guild,
      date::TEXT as date,
      rank::INTEGER as rank,
      average_points::FLOAT as average_points
    FROM daily_guild_ranks
    ORDER BY date ASC, rank ASC
  `
}

/**
 * Get users nearby in guild leaderboard
 */
export async function getNearbyGuildUsers(telegramId: string, guild: string) {
  return await sql<any[]>`
    WITH ranked_users AS (
      SELECT 
        telegram_id,
        username,
        first_name,
        points,
        guild,
        RANK() OVER (PARTITION BY guild ORDER BY points DESC) as rank
      FROM users
      WHERE guild = ${guild}
    ),
    target_rank AS (
      SELECT rank FROM ranked_users WHERE telegram_id = ${telegramId}
    )
    SELECT * FROM ranked_users
    WHERE ABS(rank - (SELECT rank FROM target_rank)) <= 2
    ORDER BY rank
  `
}