import { sql } from './index'
import { User } from '../types'

/**
 * Add points to a user and update their team's total
 */
export async function addPointsToUser(
  telegramId: string, 
  points: number
): Promise<void> {
  // Update user points
  await sql`
    UPDATE users 
    SET points = points + ${points}, updated_at = NOW()
    WHERE telegram_id = ${telegramId}
  `
  
  // Update team total if user is in a team
  await sql`
    UPDATE teams t
    SET total_points = (
      SELECT COALESCE(SUM(u.points), 0)
      FROM users u
      WHERE u.team_id = t.id
    ),
    updated_at = NOW()
    FROM users u
    WHERE u.telegram_id = ${telegramId} 
    AND u.team_id = t.id
  `
}

/**
 * Adjust user points (can be positive or negative)
 */
export async function adjustUserPoints(
  username: string,
  pointsDelta: number
): Promise<void> {
  await sql`
    UPDATE users 
    SET points = GREATEST(0, points + ${pointsDelta}), 
        updated_at = NOW()
    WHERE username = ${username}
  `
  
  // Update team totals
  await sql`
    UPDATE teams t
    SET total_points = (
      SELECT COALESCE(SUM(u.points), 0)
      FROM users u
      WHERE u.team_id = t.id
    ),
    updated_at = NOW()
    FROM users u
    WHERE u.username = ${username} 
    AND u.team_id IS NOT NULL
    AND t.id = u.team_id
  `
}

/**
 * Get team rankings (teams with 3+ members)
 * Ordered by average points per member
 */
export async function getTeamRankings(limit: number = 15) {
  return await sql`
    SELECT 
      t.name,
      COUNT(u.id) as member_count,
      SUM(u.points) as total_points,
      ROUND(AVG(u.points), 1) as average_points_per_member
    FROM teams t
    JOIN users u ON t.id = u.team_id
    WHERE u.is_active = true
    GROUP BY t.id, t.name
    HAVING COUNT(u.id) >= 3 AND SUM(u.points) > 0
    ORDER BY average_points_per_member DESC
    LIMIT ${limit}
  `
}

/**
 * Get rankings of members within a specific team
 */
export async function getTeamMemberRankings(telegramId: string) {
  return await sql`
    SELECT 
      u.first_name,
      u.username,
      u.points as total_points,
      t.name as team_name
    FROM users u
    JOIN teams t ON u.team_id = t.id
    WHERE u.team_id = (
      SELECT team_id FROM users WHERE telegram_id = ${telegramId}
    )
    ORDER BY u.points DESC
  `
}

/**
 * Get user's point summary
 */
export async function getUserSummary(telegramId: string) {
  const [user] = await sql<User[]>`
    SELECT 
      u.points,
      u.first_name,
      u.username,
      u.guild,
      t.name as team_name
    FROM users u
    LEFT JOIN teams t ON u.team_id = t.id
    WHERE u.telegram_id = ${telegramId}
  `
  return user
}

/**
 * Get guild leaderboard (guilds with 3+ active members)
 * Ordered by average points per member
 */
export async function getGuildLeaderboard() {
  return await sql`
    SELECT 
      guild,
      COUNT(*) as member_count,
      SUM(points) as total_points,
      ROUND(AVG(points), 1) as average_points
    FROM users
    WHERE is_active = true AND points > 0 AND guild IS NOT NULL
    GROUP BY guild
    HAVING COUNT(*) >= 3
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
        guild,
        points,
        ROW_NUMBER() OVER (PARTITION BY guild ORDER BY points DESC) as rank,
        COUNT(*) OVER (PARTITION BY guild) as total_count
      FROM users
      WHERE is_active = true AND points > 0 AND guild IS NOT NULL
    ),
    top_half AS (
      SELECT 
        guild,
        points,
        total_count
      FROM ranked_users
      WHERE rank <= CEIL(total_count / 2.0)
    )
    SELECT 
      guild,
      MAX(total_count) as member_count,
      ROUND(AVG(points), 1) as average_points
    FROM top_half
    GROUP BY guild
    HAVING MAX(total_count) >= 3
    ORDER BY average_points DESC
  `
}

/**
 * Get overall top users
 */
export async function getTopUsers(limit: number = 20): Promise<User[]> {
  return await sql<User[]>`
    SELECT * FROM users
    WHERE is_active = true AND points > 0
    ORDER BY points DESC
    LIMIT ${limit}
  `
}