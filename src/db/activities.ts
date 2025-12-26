import { Activity } from '../types'
import { sql } from './index'

export async function createActivity(data: {
  userId: number
  activityType: string
  duration: number
  points: number
  description?: string
  activityDate?: string  // Expected in YYYY-MM-DD format
}): Promise<Activity> {
  console.log('🔍 createActivity called with:', {
    userId: data.userId,
    activityDate: data.activityDate,
    activityDateType: typeof data.activityDate
  })
  
  // Validate and use the date
  let dateToUse: string
  
  if (data.activityDate) {
    // If it's already in YYYY-MM-DD format, use it directly
    if (/^\d{4}-\d{2}-\d{2}$/.test(data.activityDate)) {
      dateToUse = data.activityDate
    } else {
      // Try to parse and convert
      const date = new Date(data.activityDate)
      if (isNaN(date.getTime())) {
        console.error('Invalid date provided:', data.activityDate)
        dateToUse = new Date().toISOString().split('T')[0]
      } else {
        dateToUse = date.toISOString().split('T')[0]
      }
    }
  } else {
    // Default to today in YYYY-MM-DD format
    dateToUse = new Date().toISOString().split('T')[0]
  }

  console.log('🔍 Date being inserted into DB:', dateToUse) // DEBUG

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
    ORDER BY activity_date DESC, id DESC
  `
}

export async function deleteActivity(activityId: number): Promise<void> {
  await sql`
    DELETE FROM activities 
    WHERE id = ${activityId}
  `
}