require('dotenv').config()

export const telegramToken = process.env.TELEGRAM_TOKEN
export const mongodbUri = process.env.MONGODB_URI
export const startDate = process.env.COMPETITION_START_DATE
export const endDate = process.env.COMPETITION_END_DATE
export const reminderTime = process.env.REMINDER_TIME || '12:00'
export const reminderMessage = process.env.REMINDER_MSG
export const allowedDates = process.env.ALLOWED_DATES ? process.env.ALLOWED_DATES.split(',') : []
export const emojis = ['🥇', '🥈', '🥉', ' ⒋ ', ' ⒌ ', ' ⒍ ', ' ⒎ ', ' ⒏ ', ' ⒐ ', ' ⒑ ', ' ⒒ ', ' ⒓ ', ' ⒔ ', ' ⒕ ', ' ⒖ ', ' ⒗ ', ' ⒘ ', ' ⒙ ', ' ⒚ ', ' ⒛ ']
export const ErrorMsg = "Something went wrong. Please try again later or contact support."
export const adminIds = process.env.ADMINS ? process.env.ADMINS.split(',').map(id => id.trim()) : []