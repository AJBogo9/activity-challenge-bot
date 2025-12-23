import { Markup } from 'telegraf'
import { showActivityCalendar } from '../../../../utils/calendar'

export async function showDateSelection(ctx: any) {
  const activity = ctx.wizard.state.activity
  const intensity = ctx.wizard.state.intensity
  
  // Remove keyboard and show calendar
  await ctx.reply('Great! Now let\'s select the date.', Markup.removeKeyboard())
  
  await ctx.replyWithMarkdown(
    `🏃 *Log Activity - Step 5/6*\n\n*Activity:* ${activity}\n*Intensity:* ${intensity}\n*MET Value:* ${ctx.wizard.state.metValue}\n\n📅 When did you do this activity?`
  )
  
  // Show the calendar
  await showActivityCalendar(ctx)
}

export async function handleDateSelection(ctx: any) {
  // Check if date was selected
  if (!ctx.scene.session.selectedDate) {
    // Still waiting for selection, don't show error
    return
  }
  
  // Save the date
  ctx.wizard.state.activityDate = ctx.scene.session.selectedDate
  
  // Clear the selected date for next use
  delete ctx.scene.session.selectedDate
  
  return ctx.wizard.next()
}