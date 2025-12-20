import { User } from '../types'
import { sql } from './index'

export async function findUserByTelegramId(telegramId: string): Promise<User | null> {
  const result = await sql<User[]>`
    SELECT * FROM users 
    WHERE telegram_id = ${telegramId}
  `
  return result[0] || null
}

export async function createUser(data: {
  telegramId: string
  username?: string
  firstName?: string
  lastName?: string
  guild?: string
}): Promise<User> {
  const result = await sql<User[]>`
    INSERT INTO users (telegram_id, username, first_name, last_name, guild)
    VALUES (
      ${data.telegramId}, 
      ${data.username ?? null}, 
      ${data.firstName ?? null}, 
      ${data.lastName ?? null}, 
      ${data.guild ?? null}
    )
    RETURNING *
  `
  return result[0]
}

export async function updateUserPoints(userId: number, pointsToAdd: number): Promise<void> {
  await sql`
    UPDATE users 
    SET points = points + ${Number(pointsToAdd)}, updated_at = NOW()
    WHERE id = ${userId}
  `
}

export async function getTopUsersByGuild(guild: string, limit: number = 10): Promise<User[]> {
  return await sql<User[]>`
    SELECT * FROM users
    WHERE guild = ${guild} AND is_active = true
    ORDER BY points DESC
    LIMIT ${limit}
  `
}

export async function getAllUsers(): Promise<User[]> {
  return await sql<User[]>`
    SELECT * FROM users
    ORDER BY points DESC
  `
}

export async function updateUserTeam(telegramId: string, teamId: number | null): Promise<void> {
  await sql`
    UPDATE users 
    SET team_id = ${teamId}, updated_at = NOW()
    WHERE telegram_id = ${telegramId}
  `
}

export async function deleteUser(telegramId: string): Promise<void> {
  await sql`
    DELETE FROM users 
    WHERE telegram_id = ${telegramId}
  `
}

export async function findUserByUsername(username: string): Promise<User | null> {
  const result = await sql<User[]>`
    SELECT * FROM users 
    WHERE username = ${username}
  `
  return result[0] || null
}