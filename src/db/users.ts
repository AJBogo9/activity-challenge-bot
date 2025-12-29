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

export async function deleteUser(telegramId: string): Promise<void> {
  await sql`
    DELETE FROM users 
    WHERE telegram_id = ${telegramId}
  `
}