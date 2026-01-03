import { handleCalendarSelection, showActivityCalendar, TwoMessageManager } from '../../../utils'

/**
 * Display date selection screen with calendar
 */
export async function showDateSelection(ctx: any): Promise<void> {
  const activity = ctx.wizard.state.activity
  const intensity = ctx.wizard.state.intensity
  const metValue = ctx.wizard.state.metValue
  
  if (!activity || !intensity) {
    await TwoMessageManager.updateContent(
      ctx,
      '❌ Error: Missing activity information. Please start over.'
    )
    return
  }

  // Update the content message with date selection prompt
  const message = `🏃 *Log Activity - Step 5/7*\n\n*Activity:* ${activity}\n*Intensity:* ${intensity}\n*MET Value:* ${metValue}\n\n📅 When did you do this activity?`
  
  await TwoMessageManager.updateContent(ctx, message)
  
  // Show the calendar in a new message (calendar widget needs its own message)
  await showActivityCalendar(ctx)
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