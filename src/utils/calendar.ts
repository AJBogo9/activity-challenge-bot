// src/utils/calendar.ts
// @ts-ignore - Type definitions available via telegram-inline-calendar-types package
import Calendar from 'telegram-inline-calendar'
import { bot } from '../bot/instance'
import { startDate, endDate } from '../config/constants'

// Calendar for activity logging - respects competition dates
export const activityCalendar = new Calendar(bot, {
  date_format: 'DD-MM-YYYY',
  language: 'en',
  bot_api: 'telegraf',
  close_calendar: true,
  start_week_day: 1, // Monday
  start_date: startDate ? new Date(startDate) : false,
  stop_date: endDate ? new Date(endDate) : false,
  custom_start_msg: '📅 Select the date when you did this activity:'
})

// Helper function to show calendar
export async function showActivityCalendar(ctx: any) {
  try {
    return await activityCalendar.startNavCalendar(ctx.message || ctx.callbackQuery?.message)
  } catch (error) {
    console.error('Error showing calendar:', error)
    throw error
  }
}

// Helper function to handle calendar selection
export function handleCalendarSelection(ctx: any): string | null {
  if (!ctx.callbackQuery) return null
  
  const chatId = ctx.callbackQuery.message.chat.id
  const messageId = ctx.callbackQuery.message.message_id
  
  // Check if this callback is for our calendar
  if (messageId === activityCalendar.chats.get(chatId)) {
    const selectedDate = activityCalendar.clickButtonCalendar(ctx.callbackQuery)
    if (selectedDate !== -1) {
      return selectedDate as string
    }
  }
  
  return null
}