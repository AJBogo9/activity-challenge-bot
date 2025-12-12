require('dotenv').config()

module.exports = {
  telegramToken: process.env.TELEGRAM_TOKEN,
  mongodbUri: process.env.MONGODB_URI,
  startDate: process.env.COMPETITION_START_DATE,
  endDate: process.env.COMPETITION_END_DATE,
  reminderTime: process.env.REMINDER_TIME,
  reminderMessage: process.env.REMINDER_MSG,
  allowedDates: process.env.ALLOWED_DATES ? process.env.ALLOWED_DATES.split(',') : [],
  emojis: ['🥇', '🥈', '🥉', ' ⒋ ', ' ⒌ ', ' ⒍ ', ' ⒎ ', ' ⒏ ', ' ⒐ ', ' ⒑ ', ' ⒒ ', ' ⒓ ', ' ⒔ ', ' ⒕ ', ' ⒖ ', ' ⒗ ', ' ⒘ ', ' ⒙ ', ' ⒚ ', ' ⒛ '],
  Error: "Something went wrong. Please try again later or contact support.",
  adminIds: process.env.ADMINS ? process.env.ADMINS.split(',').map(id => id.trim()) : []
}