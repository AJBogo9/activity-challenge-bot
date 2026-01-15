import { 
  getActivityCalendarKeyboard, 
  handleCalendarSelection, 
  initActivityCalendar,
  isCalendarCallback,
  TwoMessageManager, 
  escapeMarkdownV2 
} from '../../../utils'

export async function showDateSelection(ctx: any): Promise<void> {
  const activity = ctx.wizard.state.activity
  const intensity = ctx.wizard.state.intensity
  const metValue = ctx.wizard.state.metValue

  if (!activity || !intensity) {
    await TwoMessageManager.updateContent(
      ctx,
      '❌ Error: Missing activity information\\. Please start over\\.'
    )
    return
  }

  const message = `🏃 *Log Activity \\- Step 5/7*\n\n*Activity:* ${escapeMarkdownV2(activity)}\n*Intensity:* ${escapeMarkdownV2(intensity)}\n*MET Value:* ${escapeMarkdownV2(String(metValue))}\n\n📅 When did you do this activity?`
  
  // Get calendar keyboard and include it in the content message
  const calendarKeyboard = getActivityCalendarKeyboard(ctx)
  
  await TwoMessageManager.updateContent(ctx, message, calendarKeyboard)
  
  // Initialize calendar tracking for this chat
  initActivityCalendar(ctx)
}

export async function handleDateSelection(ctx: any): Promise<void> {
  if (!ctx.callbackQuery?.data) {
    return
  }

  // Check if this is a calendar callback
  if (!isCalendarCallback(ctx)) {
    return
  }

  const { selectedDate, isNavigation } = handleCalendarSelection(ctx)
  
  if (selectedDate) {
    // User selected a date - save it and move to next step
    ctx.wizard.state.activityDate = selectedDate
    await ctx.answerCbQuery()
  } else if (isNavigation) {
    // User navigated calendar (prev/next month/year)
    // The calendar library already updated the display, just answer the callback
    await ctx.answerCbQuery()
  } else {
    // Empty button or space clicked
    await ctx.answerCbQuery()
  }
}