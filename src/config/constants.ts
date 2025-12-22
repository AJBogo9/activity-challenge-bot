import 'dotenv/config'

export const telegramToken = process.env.TELEGRAM_TOKEN
export const startDate = process.env.COMPETITION_START_DATE
export const endDate = process.env.COMPETITION_END_DATE
export const allowedDates = process.env.ALLOWED_DATES ? process.env.ALLOWED_DATES.split(',') : []
export const emojis = ['🥇', '🥈', '🥉', ' ⒋ ', ' ⒌ ', ' ⒍ ', ' ⒎ ', ' ⒏ ', ' ⒐ ', ' ⒑ ', ' ⒒ ', ' ⒓ ', ' ⒔ ', ' ⒕ ', ' ⒖ ', ' ⒗ ', ' ⒘ ', ' ⒙ ', ' ⒚ ', ' ⒛ ']
export const adminIds = process.env.ADMINS ? process.env.ADMINS.split(',').map(id => id.trim()) : []