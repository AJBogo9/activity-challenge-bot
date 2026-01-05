import { sql } from './index'

/**
 * Get top members of a specific guild
 * @param guildName - The name of the guild
 * @param limit - Maximum number of members to return (default: 15)
 */
export async function getTopGuildMembers(guildName: string, limit: number = 15) {
  return await sql`
    SELECT 
      telegram_id,
      first_name,
      username,
      points
    FROM users
    WHERE guild = ${guildName}
    ORDER BY points DESC
    LIMIT ${limit}
  `
}

/**
 * Get all members of a specific guild
 * @param guildName - The name of the guild
 */
export async function getGuildMembers(guildName: string) {
  return await sql`
    SELECT 
      telegram_id,
      first_name,
      username,
      guild,
      points,
      created_at
    FROM users
    WHERE guild = ${guildName}
    ORDER BY points DESC
  `
}

/**
 * Get guild statistics from database (not cached)
 * @param guildName - The name of the guild
 */
export async function getGuildStats(guildName: string) {
  const [stats] = await sql`
    SELECT 
      COUNT(id) as total_registered,
      COUNT(id) FILTER (WHERE points > 0) as active_members,
      COALESCE(SUM(points), 0) as total_points,
      COALESCE(AVG(points), 0) as avg_points_per_user,
      COALESCE(MAX(points), 0) as top_user_points
    FROM users
    WHERE guild = ${guildName}
  `
  return stats
}