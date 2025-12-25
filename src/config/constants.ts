import 'dotenv/config'

export const telegramToken = process.env.TELEGRAM_TOKEN

// Competition dates
export const startDate = process.env.COMPETITION_START_DATE || ''
export const endDate = process.env.COMPETITION_END_DATE || ''