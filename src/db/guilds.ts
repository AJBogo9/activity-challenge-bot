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
