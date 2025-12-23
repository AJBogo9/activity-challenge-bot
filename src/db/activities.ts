import { Activity } from '../types'
import { sql } from './index'

export async function createActivity(data: {
  userId: number
  activityType: string
  duration: number
  points: number
  description?: string
  activityDate?: string  // NEW: Optional activity date
}): Promise<Activity> {
  // If no date provided, use current date
  const dateToUse = data.activityDate || new Date().toISOString().split('T')[0]
  
  const [activity] = await sql<Activity[]>`
    INSERT INTO activities (user_id, activity_type, duration, points, description, activity_date)
    VALUES (
      ${data.userId}, 
      ${data.activityType}, 
      ${Math.round(data.duration)},
      ${Number(data.points)},
      ${data.description ?? null},
      ${dateToUse}
    )
    RETURNING *
  `
  return activity
}

export async function getActivitiesByUser(userId: number): Promise<Activity[]> {
  return await sql<Activity[]>`
    SELECT * FROM activities
    WHERE user_id = ${userId}
    ORDER BY activity_date DESC, created_at DESC
  `
}

export async function deleteActivity(activityId: number): Promise<void> {
  await sql`
    DELETE FROM activities 
    WHERE id = ${activityId}
  `
}