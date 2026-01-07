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
export async function getTopUsers(limit: number = 20, offset: number = 0): Promise<User[]> {
  return await sql<User[]>`
    SELECT * FROM users
    ORDER BY points DESC
    LIMIT ${limit}
    OFFSET ${offset}
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
 * Get global competition stats
 */
export async function getGlobalStats() {
  const [stats] = await sql`
    SELECT 
      COUNT(id)::INTEGER as total_players,
      SUM(points)::FLOAT as total_points,
      (SELECT COUNT(*) FROM activities)::INTEGER as total_activities,
      (SELECT activity_type FROM activities GROUP BY activity_type ORDER BY COUNT(*) DESC LIMIT 1) as popular_activity
    FROM users
  `
  return stats
}

/**
 * Takes a snapshot of current user and guild rankings
 */
export async function takeDailySnapshot() {
  const date = new Date().toISOString().split('T')[0]

  console.log(`📸 Taking daily snapshot for ${date}...`)

  await sql.begin(async (sql) => {
    // 1. User Snapshots
    await sql`
      INSERT INTO user_daily_snapshots (date, telegram_id, points, rank)
      SELECT 
        ${date}::DATE,
        telegram_id,
        points,
        RANK() OVER (ORDER BY points DESC) as rank
      FROM users
      ON CONFLICT (date, telegram_id) DO UPDATE 
      SET points = EXCLUDED.points, rank = EXCLUDED.rank
    `

    // 2. Guild Snapshots
    await sql`
      INSERT INTO guild_daily_snapshots (date, guild_name, points, rank)
      SELECT 
        ${date}::DATE,
        g.name,
        COALESCE(SUM(u.points), 0) / CAST(g.total_members AS DECIMAL) as points,
        RANK() OVER (ORDER BY COALESCE(SUM(u.points), 0) / CAST(g.total_members AS DECIMAL) DESC) as rank
      FROM guilds g
      LEFT JOIN users u ON g.name = u.guild
      WHERE g.is_active = TRUE
      GROUP BY g.name, g.total_members
      ON CONFLICT (date, guild_name) DO UPDATE 
      SET points = EXCLUDED.points, rank = EXCLUDED.rank
    `
  })

  console.log('✅ Snapshots saved.')
}

/**
 * Get ranking history for the last N days
 * Combines snapshots with live calculation for today
 */
export async function getUserRankingHistory(telegramId: string, days: number = 30) {
  return await sql`
    WITH history AS (
      -- 1. Get past snapshots
      SELECT 
        date::DATE as date,
        rank::INTEGER as rank,
        points::FLOAT as points
      FROM user_daily_snapshots
      WHERE telegram_id = ${telegramId}
        AND date > CURRENT_DATE - (${days} || ' days')::INTERVAL
        AND date < CURRENT_DATE

      UNION ALL

      -- 2. Calculate fresh data for today
      SELECT 
        CURRENT_DATE as date,
        rank::INTEGER as rank,
        points::FLOAT as points
      FROM (
        SELECT 
          telegram_id,
          points,
          RANK() OVER (ORDER BY points DESC) as rank
        FROM users
      ) today
      WHERE telegram_id = ${telegramId}
    ),
    recent_dates AS (
      SELECT DISTINCT date FROM history ORDER BY date DESC LIMIT ${days}
    )
    SELECT 
      h.date::TEXT as date,
      h.rank,
      h.points
    FROM history h
    JOIN recent_dates rd ON h.date = rd.date
    ORDER BY h.date ASC
  `
}

/**
 * Get ranking history for all guilds for the last N days
 */
export async function getGuildRankingHistory(days: number = 30) {
  return await sql`
    WITH history AS (
      -- 1. Past snapshots
      SELECT 
        guild_name as guild,
        date::DATE as date,
        rank::INTEGER as rank,
        points::FLOAT as average_points
      FROM guild_daily_snapshots
      WHERE date > CURRENT_DATE - (${days} || ' days')::INTERVAL
        AND date < CURRENT_DATE

      UNION ALL

      -- 2. Fresh today
      SELECT 
        guild,
        CURRENT_DATE as date,
        RANK() OVER (ORDER BY average_points DESC)::INTEGER as rank,
        average_points
      FROM (
        SELECT 
          g.name as guild,
          COALESCE(SUM(u.points), 0) / NULLIF(CAST(g.total_members AS DECIMAL), 0) as average_points
        FROM guilds g
        LEFT JOIN users u ON g.name = u.guild
        WHERE g.is_active = TRUE
        GROUP BY g.name, g.total_members
      ) today
    ),
    recent_dates AS (
      SELECT DISTINCT date FROM history ORDER BY date DESC LIMIT ${days}
    )
    SELECT 
      h.guild,
      h.date::TEXT as date,
      h.rank,
      h.average_points::FLOAT as average_points
    FROM history h
    JOIN recent_dates rd ON h.date = rd.date
    ORDER BY h.date ASC, h.rank ASC
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