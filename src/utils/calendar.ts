// @ts-expect-error - No type definitions available for telegram-inline-calendar
import Calendar from 'telegram-inline-calendar'
import { bot } from '../bot/instance'
import { startDate, endDate } from '../constants'

/**
 * Calendar for activity logging - respects competition dates
 */
const activityCalendar = new Calendar(bot, {
  date_format: 'YYYY-MM-DD',
  language: 'en',
  bot_api: 'telegraf',
  close_calendar: true,
  start_week_day: 1, // Monday
  start_date: startDate ? new Date(startDate) : false,
  stop_date: endDate ? new Date(endDate) : false,
  custom_start_msg: '📅 Select the date when you did this activity:'
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
      console.log('📅 Date selected from calendar:', result)
      return result as string
    }
  }

  return null
}