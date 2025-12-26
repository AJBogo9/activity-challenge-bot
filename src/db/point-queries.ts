import { sql } from './index'
import { User } from '../types'

/**
 * Add points to a user
 */
export async function addPointsToUser(
  telegramId: string,
  points: number
): Promise<void> {
  // Update user points
  await sql`
    UPDATE users 
    SET points = points + ${points}
    WHERE telegram_id = ${telegramId}
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
 * Get guild leaderboard (guilds with 3+ members)
 * Ordered by average points per member
 */
export async function getGuildLeaderboard() {
  return await sql`
    SELECT 
      g.name as guild,
      COUNT(u.id) as active_members,
      g.total_members as total_members,
      ROUND(COUNT(u.id)::DECIMAL / g.total_members * 100, 1) as participation_percentage,
      SUM(COALESCE(u.points, 0)) as total_points,
      ROUND(SUM(COALESCE(u.points, 0)) / CAST(g.total_members AS DECIMAL), 1) as average_points
    FROM guilds g
    LEFT JOIN users u ON g.name = u.guild
    WHERE g.is_active = TRUE
    GROUP BY g.name, g.total_members
    HAVING COUNT(u.id) >= 3
    ORDER BY average_points DESC
  `
}

/**
 * Get guild leaderboard based on top 50% of members
 */
export async function getGuildTopLeaderboard() {
  return await sql`
    WITH ranked_users AS (
      SELECT 
        u.guild,
        u.points,
        ROW_NUMBER() OVER (PARTITION BY u.guild ORDER BY u.points DESC) as rank,
        g.total_members
      FROM users u
      JOIN guilds g ON u.guild = g.name
      WHERE u.points > 0 AND g.is_active = TRUE
    ),
    top_half AS (
      SELECT 
        guild,
        points,
        total_members
      FROM ranked_users
      WHERE rank <= CEIL(total_members / 2.0)
    )
    SELECT 
      guild,
      total_members,
      ROUND(AVG(points), 1) as average_points
    FROM top_half
    GROUP BY guild, total_members
    HAVING total_members >= 3
    ORDER BY average_points DESC
  `
}

/**
 * Get overall top users
 */
export async function getTopUsers(limit: number = 20): Promise<User[]> {
  return await sql<User[]>`
    SELECT * FROM users
    WHERE points > 0
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