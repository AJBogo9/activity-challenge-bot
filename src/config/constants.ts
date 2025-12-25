import 'dotenv/config'

export const botToken = process.env.BOT_TOKEN

// Competition dates
export const startDate = process.env.COMPETITION_START_DATE || ''
export const endDate = process.env.COMPETITION_END_DATE || ''