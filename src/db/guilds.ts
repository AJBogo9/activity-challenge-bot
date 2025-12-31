import { sql } from './index'
import { Guild } from '../types'

/**
 * Get all active guilds from the database
 */
export async function getActiveGuilds(): Promise<Guild[]> {
    return await sql<Guild[]>`
    SELECT * FROM guilds 
    WHERE is_active = TRUE
    ORDER BY name ASC
  `
}

/**
 * Get all guild names
 */
export async function getGuildNames(): Promise<string[]> {
    const guilds = await getActiveGuilds()
    return guilds.map(g => g.name)
}


/**
 * Get top guild members
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