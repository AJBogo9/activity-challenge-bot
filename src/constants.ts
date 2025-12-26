import 'dotenv/config'

// Validate required environment variables
const BOT_TOKEN = process.env.BOT_TOKEN
if (!BOT_TOKEN) {
  throw new Error('BOT_TOKEN environment variable is required')
}

export const botToken = BOT_TOKEN

// Competition dates with validation
export const startDate = process.env.COMPETITION_START_DATE || ''
export const endDate = process.env.COMPETITION_END_DATE || ''

if (startDate && isNaN(Date.parse(startDate))) {
  throw new Error(`COMPETITION_START_DATE must be a valid date, got: ${startDate}`)
}

if (endDate && isNaN(Date.parse(endDate))) {
  throw new Error(`COMPETITION_END_DATE must be a valid date, got: ${endDate}`)
}

if (!startDate || !endDate) {
  console.warn('⚠️  Competition dates not set! Calendar will show all dates.')
}