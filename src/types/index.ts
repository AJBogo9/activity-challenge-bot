export interface User {
  id: number
  telegram_id: string
  username?: string
  first_name?: string
  last_name?: string
  guild?: string
  team_id?: number
  points: number
  is_active: boolean
  created_at: Date
  updated_at: Date
}

export interface Activity {
  id: number
  user_id: number
  activity_type: string
  duration?: number
  points: number
  description?: string
  verified_by?: number
  is_verified: boolean
  created_at: Date
  activity_date: Date
}

export const VALID_GUILDS = [
  'TiK', 'DG', 'FK', 'PT', 'AS', 'SIK', 'KIK', 'MK', 'IK', 
  'Athene', 'Prodeko', 'Inkubio', 'KY', 'TOKYO', 'AK', 'TF', 'PJK', 'VK', 'KK'
] as const