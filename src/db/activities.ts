import { Activity } from '../types'
import { sql } from './index'

export async function createActivity(data: {
  userId: number
  activityType: string
  duration: number
  points: number
  description?: string
}): Promise<Activity> {
  const [activity] = await sql<Activity[]>`
    INSERT INTO activities (user_id, activity_type, duration, points, description)
    VALUES (
      ${data.userId}, 
      ${data.activityType}, 
      ${Math.round(data.duration)},
      ${Number(data.points)},
      ${data.description ?? null}
    )
    RETURNING *
  `
  return activity
}

export async function getActivitiesByUser(userId: number): Promise<Activity[]> {
  return await sql<Activity[]>`
    SELECT * FROM activities
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
  `
}

export async function getRecentActivities(limit: number = 20): Promise<Activity[]> {
  return await sql<Activity[]>`
    SELECT a.*, u.username, u.first_name, u.guild
    FROM activities a
    JOIN users u ON a.user_id = u.id
    ORDER BY a.created_at DESC
    LIMIT ${limit}
  `
}

export async function getAllActivities(): Promise<Activity[]> {
  return await sql<Activity[]>`
    SELECT * FROM activities
    ORDER BY created_at DESC
  `
}

export async function deleteActivity(activityId: number): Promise<void> {
  await sql`
    DELETE FROM activities 
    WHERE id = ${activityId}
  `
}