import { Markup } from 'telegraf'

/**
 * Display duration selection screen with quick options
 */
export async function showDurationSelection(ctx: any): Promise<void> {
  const activity = ctx.wizard.state.activity
  const intensity = ctx.wizard.state.intensity
  const activityDate = ctx.wizard.state.activityDate
  const metValue = ctx.wizard.state.metValue
  
  if (!activity || !intensity || !activityDate || !metValue) {
    await ctx.reply('❌ Error: Missing activity information. Please start over.')
    return
  }

  // Format date for display
  const dateStr = activityDate instanceof Date 
    ? activityDate.toLocaleDateString() 
    : activityDate

  await ctx.replyWithMarkdown(
    `🏃 *Log Activity - Step 6/6*\n\n` +
    `*Activity:* ${activity}\n` +
    `*Intensity:* ${intensity}\n` +
    `*Date:* ${dateStr}\n` +
    `*MET Value:* ${metValue}\n\n` +
    `⏱️ How many minutes did you exercise?\n\n` +
    `_Tap a quick option below or type a custom number:_`,
    Markup.inlineKeyboard([
      [
        Markup.button.callback('15 min', 'duration:15'),
        Markup.button.callback('20 min', 'duration:20'),
        Markup.button.callback('30 min', 'duration:30')
      ],
      [
        Markup.button.callback('45 min', 'duration:45'),
        Markup.button.callback('60 min', 'duration:60'),
        Markup.button.callback('90 min', 'duration:90')
      ],
      [
        Markup.button.callback('120 min', 'duration:120'),
        Markup.button.callback('⬅️ Back', 'duration:back'),
        Markup.button.callback('❌ Cancel', 'duration:cancel')
      ]
    ])
  )
}

/**
 * Handle duration input from inline buttons or text
 */
export async function handleDurationInput(ctx: any): Promise<void> {
  let minutes: number | undefined

  // Handle inline button callback
  if (ctx.callbackQuery?.data) {
    const data = ctx.callbackQuery.data
    
    // Skip back/cancel - handled in wizard
    if (data === 'duration:back' || data === 'duration:cancel') {
      return
    }

    // Extract duration from button callback
    if (data.startsWith('duration:')) {
      await ctx.answerCbQuery()
      const durationStr = data.split(':')[1]
      minutes = parseInt(durationStr, 10)
    } else {
      await ctx.answerCbQuery()
      return
    }
  } 
  // Handle text input
  else if (ctx.message?.text) {
    const input = ctx.message.text.trim()
    minutes = parseInt(input, 10)
  } else {
    return
  }

  // Validate duration
  if (!minutes || isNaN(minutes) || minutes <= 0 || minutes > 1440) {
    await ctx.reply('❌ Please enter a valid number of minutes (1-1440).')
    return
  }

  // Store duration in wizard state
  ctx.wizard.state.duration = minutes

  // Calculate points for preview (MET * hours)
  const metValue = ctx.wizard.state.metValue
  const points = Number(((metValue * minutes) / 60).toFixed(2))
  ctx.wizard.state.calculatedPoints = points
}