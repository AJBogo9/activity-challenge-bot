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
export async function getTopUsers(limit: number = 20): Promise<User[]> {
  return await sql<User[]>`
    SELECT * FROM users
    ORDER BY points DESC
    LIMIT ${limit}
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
  
  // Build a map of guild name to total members
  const guildMembersMap = new Map<string, number>();
  activeGuilds.forEach(g => guildMembersMap.set(g.name, g.totalMembers));
  
  return await sql`
    WITH RECURSIVE dates AS (
      SELECT (CURRENT_DATE - (${days} || ' days')::INTERVAL)::DATE as date
      UNION ALL
      SELECT (date + '1 day'::INTERVAL)::DATE
      FROM dates
      WHERE date < CURRENT_DATE
    ),
    guild_names AS (
      SELECT unnest(ARRAY[${activeGuilds.map(g => g.name)}]::TEXT[]) as guild_name,
             unnest(ARRAY[${activeGuilds.map(g => g.totalMembers)}]::INTEGER[]) as total_members
    ),
    daily_guild_points AS (
      SELECT 
        gn.guild_name as guild,
        d.date,
        COALESCE(SUM(a.points), 0) / CAST(gn.total_members AS DECIMAL) as average_points
      FROM guild_names gn
      CROSS JOIN dates d
      LEFT JOIN users u ON gn.guild_name = u.guild
      LEFT JOIN activities a ON u.id = a.user_id AND a.activity_date <= d.date
      GROUP BY gn.guild_name, d.date, gn.total_members
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