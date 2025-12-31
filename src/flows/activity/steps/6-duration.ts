import { Markup } from 'telegraf'
import { TwoMessageManager } from '../../../utils/two-message-manager'

/**
 * Display duration selection screen with quick options
 */
export async function showDurationSelection(ctx: any): Promise<void> {
  const activity = ctx.wizard.state.activity
  const intensity = ctx.wizard.state.intensity
  const activityDate = ctx.wizard.state.activityDate
  const metValue = ctx.wizard.state.metValue
  
  if (!activity || !intensity || !activityDate || !metValue) {
    await TwoMessageManager.updateContent(
      ctx,
      '❌ Error: Missing activity information. Please start over.'
    )
    return
  }

  // Format date for display
  const dateStr = activityDate instanceof Date 
    ? activityDate.toLocaleDateString() 
    : activityDate

  const message = `🏃 *Log Activity - Step 6/7*

*Activity:* ${activity}
*Intensity:* ${intensity}
*Date:* ${dateStr}
*MET Value:* ${metValue}

⏱️ How many minutes did you exercise?

_Tap a quick option below or type a custom number:_`

  const keyboard = Markup.inlineKeyboard([
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
      Markup.button.callback('❌ Cancel', 'duration:cancel')
    ]
  ])

  await TwoMessageManager.updateContent(ctx, message, keyboard)
}

/**
 * Handle duration input from inline buttons or text
 */
export async function handleDurationInput(ctx: any): Promise<void> {
  let minutes: number | undefined

  // Handle inline button callback
  if (ctx.callbackQuery?.data) {
    const data = ctx.callbackQuery.data

    // Skip cancel - handled in wizard
    if (data === 'duration:cancel') {
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
    // Delete the user's text message to keep chat clean
    await TwoMessageManager.deleteUserMessage(ctx)
    
    const input = ctx.message.text.trim()
    minutes = parseInt(input, 10)
  } else {
    return
  }

  // Validate duration
  if (!minutes || isNaN(minutes) || minutes <= 0 || minutes > 1440) {
    await TwoMessageManager.updateContent(
      ctx,
      '❌ Please enter a valid number of minutes (1-1440) or use the buttons below.',
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
          Markup.button.callback('❌ Cancel', 'duration:cancel')
        ]
      ])
    )
    return
  }

  // Store duration in wizard state
  ctx.wizard.state.duration = minutes

  // Calculate points for preview (MET * hours)
  const metValue = ctx.wizard.state.metValue
  const points = Number(((metValue * minutes) / 60).toFixed(2))
  ctx.wizard.state.calculatedPoints = points
}