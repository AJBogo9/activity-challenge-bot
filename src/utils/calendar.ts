// @ts-expect-error - No type definitions available for telegram-inline-calendar
import Calendar from 'telegram-inline-calendar'
import { bot } from '../bot/instance'
import { startDate, endDate } from '../constants'

// Parse dates with explicit handling
const parseDate = (dateStr: string): Date | false => {
  if (!dateStr) return false
  
  // Parse YYYY-MM-DD format explicitly at noon UTC to avoid timezone issues
  const [year, month, day] = dateStr.split('-').map(Number)
  if (!year || !month || !day) return false
  
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0))
}

const parsedStartDate = parseDate(startDate)
const parsedEndDate = parseDate(endDate)

/**
 * Calendar for activity logging - respects competition dates
 */
const activityCalendar = new Calendar(bot, {
  date_format: 'YYYY-MM-DD',
  language: 'en',
  bot_api: 'telegraf',
  close_calendar: true,
  start_week_day: 1, // Monday
  start_date: parsedStartDate,
  stop_date: parsedEndDate
})

/**
 * Show the activity calendar picker
 * @param ctx - Telegram context
 */
export async function showActivityCalendar(ctx: any): Promise<any> {
  try {
    const message = ctx.message || ctx.callbackQuery?.message
    if (!message) {
      throw new Error('No message context available for calendar')
    }
    
    return await activityCalendar.startNavCalendar(message)
  } catch (error) {
    console.error('Error showing calendar:', error)
    throw error
  }
}

/**
 * Handle calendar button clicks and date selection
 * @param ctx - Telegram context with callback query
 * @returns Selected date string (YYYY-MM-DD) or null if navigation/no selection
 */
export function handleCalendarSelection(ctx: any): string | null {
  if (!ctx.callbackQuery?.message) {
    return null
  }

  const chatId = ctx.callbackQuery.message.chat.id
  const messageId = ctx.callbackQuery.message.message_id

  // Check if this callback is for our calendar
  if (messageId === activityCalendar.chats.get(chatId)) {
    const result = activityCalendar.clickButtonCalendar(ctx.callbackQuery)
    
    // -1 means calendar navigation (prev/next month), not a date selection
    if (result !== -1 && result) {
      return result as string
    }
  }

  return null
}