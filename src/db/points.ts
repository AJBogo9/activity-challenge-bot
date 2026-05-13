import { sql } from './index'
import { User } from '../types'
import { getActiveGuilds } from '../config/guilds'

// ==================== USER POINTS ====================

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

// ==================== RANKING HISTORY ====================

// ==================== USER STATISTICS ====================

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

// ==================== LEADERBOARD RANKINGS ====================

/**
 * Overall top users
 */
export async function getTopUsers(limit: number = 20, offset: number = 0): Promise<User[]> {
  return await sql<User[]>`
    SELECT * FROM users
    ORDER BY points DESC
    LIMIT ${limit}
    OFFSET ${offset}
  `
}

// ==================== USER RANKINGS ====================

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

// ==================== GUILD LEADERBOARD WITH CACHING ====================

interface GuildStatsCache {
  guild: string;
  totalPoints: number;
  activeMembers: number;
  registeredMembers: number;
  totalMembers: number;
  participationPercentage: number;
  averagePoints: number;
  lastUpdated: Date;
}

// In-memory cache
let guildStatsCache: GuildStatsCache[] = [];
let lastCacheUpdate: Date | null = null;

// Cache TTL: 5 minutes
const CACHE_TTL_MS = 5 * 60 * 1000;

/**
 * Get guild leaderboard (with caching)
 * @param forceRefresh - Force cache refresh even if cache is fresh
 */
export async function getGuildLeaderboard(forceRefresh = false): Promise<GuildStatsCache[]> {
  const now = new Date();
  const cacheAge = lastCacheUpdate ? now.getTime() - lastCacheUpdate.getTime() : Infinity;
  
  // Return cached data if fresh enough and not forcing refresh
  if (!forceRefresh && cacheAge < CACHE_TTL_MS && guildStatsCache.length > 0) {
    return guildStatsCache;
  }
  
  // Recalculate from database
  const activeGuilds = getActiveGuilds();
  const stats: GuildStatsCache[] = [];
  
  for (const guildConfig of activeGuilds) {
    const [result] = await sql`
      SELECT 
        COUNT(id) FILTER (WHERE points > 0) as active_members,
        COUNT(id) as registered_members,
        COALESCE(SUM(points), 0) as total_points
      FROM users
      WHERE guild = ${guildConfig.name}
    `;
    
    const totalPoints = parseFloat(result.total_points) || 0;
    const activeMembers = parseInt(result.active_members) || 0;
    const registeredMembers = parseInt(result.registered_members) || 0;
    const totalMembers = guildConfig.totalMembers;
    
    const averagePoints = parseFloat((totalPoints / totalMembers).toFixed(1));
    const participationPercentage = parseFloat(
      ((activeMembers / totalMembers) * 100).toFixed(1)
    );
    
    stats.push({
      guild: guildConfig.name,
      totalPoints,
      activeMembers,
      registeredMembers,
      totalMembers,
      participationPercentage,
      averagePoints,
      lastUpdated: now
    });
  }
  
  // Sort by average points (highest first)
  stats.sort((a, b) => b.averagePoints - a.averagePoints);
  
  // Update cache
  guildStatsCache = stats;
  lastCacheUpdate = now;
  
  return stats;
}

/**
 * Get ranking history for all guilds for the last N days
 */
export async function getGuildRankingHistory(days: number = 30) {
  const activeGuilds = getActiveGuilds();
  
  // Extract arrays outside the SQL query
  const guildNames = activeGuilds.map(g => g.name);
  const guildMembers = activeGuilds.map(g => g.totalMembers);
  
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
 * Invalidate the guild leaderboard cache
 * Call this after activities are logged to ensure fresh data on next request
 */
export function invalidateGuildCache(): void {
  lastCacheUpdate = null;
}

/**
 * Get cache info (useful for debugging)
 */
export function getGuildCacheInfo() {
  return {
    isCached: guildStatsCache.length > 0 && lastCacheUpdate !== null,
    lastUpdate: lastCacheUpdate,
    cacheAge: lastCacheUpdate ? Date.now() - lastCacheUpdate.getTime() : null,
    ttl: CACHE_TTL_MS,
    isStale: lastCacheUpdate ? Date.now() - lastCacheUpdate.getTime() > CACHE_TTL_MS : true
  };
}