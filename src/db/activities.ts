import { Activity } from '../types'
import { sql } from './index'

export async function createActivity(data: {
  userId: number
  activityType: string
  duration: number
  points: number
  description?: string
  activityDate: Date
}): Promise<void> {
  await sql`
    INSERT INTO activities (user_id, activity_type, duration, points, description, activity_date)
    VALUES (
      ${data.userId}, 
      ${data.activityType}, 
      ${Math.round(data.duration)},
      ${data.points},
      ${data.description ?? null},
      ${data.activityDate}
    )
  `
}

export async function getActivitiesByUser(userId: number): Promise<Activity[]> {
  return await sql<Activity[]>`
    SELECT * FROM activities
    WHERE user_id = ${userId}
    ORDER BY activity_date DESC, id DESC
  `
}

export async function deleteActivity(activityId: number): Promise<void> {
  await sql`
    DELETE FROM activities 
    WHERE id = ${activityId}
  `
}