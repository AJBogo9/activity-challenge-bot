import { Team, User } from '../types'
import { sql } from './index'

export async function createTeam(name: string, guild: string): Promise<Team> {
  const [team] = await sql<Team[]>`
    INSERT INTO teams (name, guild)
    VALUES (${name}, ${guild})
    RETURNING *
  `
  return team
}

export async function getTeamsByGuild(guild: string): Promise<Team[]> {
  return await sql<Team[]>`
    SELECT * FROM teams
    WHERE guild = ${guild}
    ORDER BY total_points DESC
  `
}

export async function getTeamLeaderboard(): Promise<Team[]> {
  return await sql<Team[]>`
    SELECT t.*, COUNT(u.id) as member_count
    FROM teams t
    LEFT JOIN users u ON t.id = u.team_id
    GROUP BY t.id
    ORDER BY t.total_points DESC
  `
}

export async function updateTeamPoints(teamId: number): Promise<void> {
  await sql`
    UPDATE teams
    SET total_points = (
      SELECT COALESCE(SUM(points), 0)
      FROM users
      WHERE team_id = ${teamId}
    ),
    updated_at = NOW()
    WHERE id = ${teamId}
  `
}

export async function findTeamById(teamId: number): Promise<Team | null> {
  const result = await sql<Team[]>`
    SELECT * FROM teams 
    WHERE id = ${teamId}
  `
  return result[0] || null
}

export async function findTeamByName(name: string): Promise<Team | null> {
  const result = await sql<Team[]>`
    SELECT * FROM teams 
    WHERE name = ${name}
  `
  return result[0] || null
}

export async function deleteTeam(teamId: number): Promise<void> {
  // First, remove team reference from users
  await sql`
    UPDATE users 
    SET team_id = NULL 
    WHERE team_id = ${teamId}
  `
  
  // Then delete the team
  await sql`
    DELETE FROM teams 
    WHERE id = ${teamId}
  `
}

export async function getTeamMembers(teamId: number): Promise<User[]> {
  return await sql<User[]>`
    SELECT * FROM users
    WHERE team_id = ${teamId}
    ORDER BY points DESC
  `
}