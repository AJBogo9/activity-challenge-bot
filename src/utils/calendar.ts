// @ts-expect-error - No type definitions available for telegram-inline-calendar
import Calendar from 'telegram-inline-calendar';
import { bot } from '../bot/instance';
import { CURRENT_COMPETITION } from '../config';
import { Markup } from 'telegraf';

/**
 * Convert Date object to YYYY-MM-DD format at noon UTC to avoid timezone issues
 */
const formatDateForCalendar = (date: Date): Date => {
  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0));
};

/**
 * Calendar for activity logging - respects competition dates
 */
const activityCalendar = new Calendar(bot, {
  date_format: 'YYYY-MM-DD',
  language: 'en',
  bot_api: 'telegraf',
  close_calendar: false, // We manage calendar lifecycle ourselves
  start_week_day: 1, // Monday
  start_date: formatDateForCalendar(CURRENT_COMPETITION.startDate),
  stop_date: formatDateForCalendar(CURRENT_COMPETITION.endDate)
});

/**
 * Initialize calendar for a chat - must be called before using calendar
 */
export function initActivityCalendar(ctx: any): void {
  const chatId = ctx.chat?.id || ctx.from?.id;
  const messageId = ctx.session?.contentMessageId;
  
  if (chatId && messageId) {
    // Register this message ID with the calendar library
    activityCalendar.chats.set(chatId, messageId);
  }
}

/**
 * Cleanup calendar state for a chat
 */
export function cleanupActivityCalendar(ctx: any): void {
  const chatId = ctx.chat?.id || ctx.from?.id;
  if (chatId) {
    activityCalendar.chats.delete(chatId);
  }
}

/**
 * Get the calendar inline keyboard without sending a message
 * @param ctx - Telegram context
 * @param date - Optional date to show calendar for (defaults to current month)
 * @returns Inline keyboard markup for the calendar
 */
export function getActivityCalendarKeyboard(ctx: any, date?: Date): any {
  try {
    const chatId = ctx.chat?.id || ctx.from?.id;
    
    // Determine which date to show
    let calendarDate = new Date();
    calendarDate.setDate(1);
    calendarDate.setHours(0, 0, 0, 0);
    
    if (date) {
      calendarDate = new Date(date);
      calendarDate.setDate(1);
      calendarDate.setHours(0, 0, 0, 0);
    } else if (CURRENT_COMPETITION.startDate > calendarDate) {
      // If current month is before competition start, show competition start month
      calendarDate = new Date(CURRENT_COMPETITION.startDate);
      calendarDate.setDate(1);
      calendarDate.setHours(0, 0, 0, 0);
    }
    
    // Use the calendar library's internal method to generate keyboard
    const keyboardMarkup = activityCalendar.createNavigationKeyboard(
      activityCalendar.checkLanguage(chatId),
      calendarDate
    );
    
    return Markup.inlineKeyboard(keyboardMarkup.inline_keyboard);
  } catch (error) {
    console.error('Error getting calendar keyboard:', error);
    throw error;
  }
}

/**
 * Check if a callback query is for the calendar
 */
export function isCalendarCallback(ctx: any): boolean {
  const data = ctx.callbackQuery?.data;
  if (!data) return false;
  
  // Calendar callbacks start with 'n_' for date navigation or date selection
  return data.startsWith('n_') || data === ' ';
}

/**
 * Handle calendar button clicks and date selection
 * @param ctx - Telegram context with callback query
 * @returns Object with selectedDate (string | null) and isNavigation (boolean)
 */
export function handleCalendarSelection(ctx: any): { selectedDate: string | null; isNavigation: boolean } {
  if (!ctx.callbackQuery?.message) {
    return { selectedDate: null, isNavigation: false };
  }

  const chatId = ctx.callbackQuery.message.chat.id;
  const contentMessageId = ctx.session?.contentMessageId;
  
  // CRITICAL: Make sure the calendar library knows which message to edit
  if (contentMessageId) {
    activityCalendar.chats.set(chatId, contentMessageId);
  }

  // Check if this callback is from our content message
  if (ctx.callbackQuery.message.message_id === contentMessageId) {
    // The library's clickButtonCalendar already handles editing the message for navigation
    const result = activityCalendar.clickButtonCalendar(ctx.callbackQuery);
    
    // result === -1 means calendar navigation (the library already updated the display)
    if (result === -1) {
      return { selectedDate: null, isNavigation: true };
    } else if (result && result !== -1) {
      // A date was selected
      return { selectedDate: result as string, isNavigation: false };
    }
  }

  return { selectedDate: null, isNavigation: false };
}