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

export async function getRecentActivities(limit: number = 20): Promise<Activity[]> {
  return await sql<Activity[]>`
    SELECT a.*, u.username, u.first_name, u.guild
    FROM activities a
    JOIN users u ON a.user_id = u.id
    ORDER BY a.activity_date DESC, a.created_at DESC
    LIMIT ${limit}
  `
}

export async function getAllActivities(): Promise<Activity[]> {
  return await sql<Activity[]>`
    SELECT * FROM activities
    ORDER BY activity_date DESC, created_at DESC
  `
}

export async function deleteActivity(activityId: number): Promise<void> {
  await sql`
    DELETE FROM activities 
    WHERE id = ${activityId}
  `
}

// NEW: Get activities by date range
export async function getActivitiesByDateRange(
  userId: number,
  startDate: string,
  endDate: string
): Promise<Activity[]> {
  return await sql<Activity[]>`
    SELECT * FROM activities
    WHERE user_id = ${userId}
    AND activity_date BETWEEN ${startDate} AND ${endDate}
    ORDER BY activity_date DESC
  `
}