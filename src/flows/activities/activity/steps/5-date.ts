import { Markup } from 'telegraf'
import { handleCalendarSelection, showActivityCalendar } from '../../../../utils/calendar'

/**
 * Display date selection screen with calendar
 */
export async function showDateSelection(ctx: any): Promise<void> {
  const activity = ctx.wizard.state.activity
  const intensity = ctx.wizard.state.intensity
  const metValue = ctx.wizard.state.metValue

  if (!activity || !intensity) {
    await ctx.reply('❌ Error: Missing activity information. Please start over.')
    return
  }

  // Remove keyboard and show calendar
  await ctx.reply('Great! Now let\'s select the date.', Markup.removeKeyboard())
  await ctx.replyWithMarkdown(
    `🏃 *Log Activity - Step 5/6*\n\n*Activity:* ${activity}\n*Intensity:* ${intensity}\n*MET Value:* ${metValue}\n\n📅 When did you do this activity?`
  )

  // Show the calendar
  await showActivityCalendar(ctx)

  // Add Cancel button below the calendar
  await ctx.reply(
    'Need to cancel?',
    Markup.inlineKeyboard([
      [Markup.button.callback('❌ Cancel', 'date:cancel')]
    ])
  )
}

/**
 * Handle date selection from calendar callback
 * Sets activityDate in wizard state if a date was selected
 */
export async function handleDateSelection(ctx: any): Promise<void> {
  // Only process callback queries
  if (!ctx.callbackQuery?.data) {
    return
  }

  // Use the calendar handler to get the selected date
  const selectedDate = handleCalendarSelection(ctx)

  // If a date was selected (not just calendar navigation)
  if (selectedDate) {
    ctx.wizard.state.activityDate = selectedDate
  }
}