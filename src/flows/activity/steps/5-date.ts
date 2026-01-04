import { handleCalendarSelection, showActivityCalendar, TwoMessageManager, escapeMarkdownV2 } from '../../../utils'

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
  
  await TwoMessageManager.updateContent(ctx, message)
  await showActivityCalendar(ctx)
}

export async function handleDateSelection(ctx: any): Promise<void> {
  if (!ctx.callbackQuery?.data) {
    return
  }

  const selectedDate = handleCalendarSelection(ctx)
  
  if (selectedDate) {
    ctx.wizard.state.activityDate = selectedDate
  }
}