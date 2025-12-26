import { Markup } from 'telegraf'
import { showActivityCalendar } from '../../../../utils/calendar'
import { handleCancel } from '../helpers/navigation'

export async function showDurationSelection(ctx: any) {
  const activity = ctx.wizard.state.activity
  const intensity = ctx.wizard.state.intensity
  
  // Create inline keyboard with common duration options
  await ctx.replyWithMarkdown(
    `🏃 *Log Activity - Step 6/7*\n\n*Activity:* ${activity}\n*Intensity:* ${intensity}\n*Date:* ${ctx.wizard.state.activityDate}\n*MET Value:* ${ctx.wizard.state.metValue}\n\nHow many minutes did you exercise?\n\n_Tap a quick option below or type a custom number:_`,
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

export async function handleDurationInput(ctx: any) {
  console.log('🔍 Duration step - wizard.state.activityDate:', ctx.wizard.state.activityDate) // DEBUG
  
  let minutes: number
  
  // Handle inline button callback
  if (ctx.callbackQuery?.data) {
    const data = ctx.callbackQuery.data
    
    if (data === 'duration:cancel') {
      await ctx.answerCbQuery()
      return handleCancel(ctx)
    }
    
    if (data === 'duration:back') {
      await ctx.answerCbQuery()
      
      // Clean up state
      delete ctx.wizard.state.activityDate
      
      const activity = ctx.wizard.state.activity
      const intensity = ctx.wizard.state.intensity
      
      await ctx.replyWithMarkdown(
        `🏃 *Log Activity - Step 5/7*\n\n*Activity:* ${activity}\n*Intensity:* ${intensity}\n*MET Value:* ${ctx.wizard.state.metValue}\n\n📅 When did you do this activity?`
      )
      
      // Show calendar again
      await showActivityCalendar(ctx)
      
      // Go back to step 4 (index 3) to handle calendar callbacks
      return ctx.wizard.selectStep(3)
    }
    
    if (data.startsWith('duration:')) {
      await ctx.answerCbQuery()
      const durationStr = data.split(':')[1]
      minutes = parseInt(durationStr)
    } else {
      await ctx.answerCbQuery()
      return
    }
  } 
  // Handle text input
  else if (ctx.message?.text) {
    const duration = ctx.message.text
    
    if (duration === '❌ Cancel') {
      return handleCancel(ctx)
    }
    
    if (duration === '⬅️ Back') {
      // Clean up state
      delete ctx.wizard.state.activityDate
      
      const activity = ctx.wizard.state.activity
      const intensity = ctx.wizard.state.intensity
      
      await ctx.replyWithMarkdown(
        `🏃 *Log Activity - Step 5/7*\n\n*Activity:* ${activity}\n*Intensity:* ${intensity}\n*MET Value:* ${ctx.wizard.state.metValue}\n\n📅 When did you do this activity?`
      )
      
      // Show calendar again
      await showActivityCalendar(ctx)
      
      // Go back to step 4 (index 3) to handle calendar callbacks
      return ctx.wizard.selectStep(3)
    }
    
    minutes = parseInt(duration)
  } else {
    return
  }
  
  if (isNaN(minutes) || minutes <= 0) {
    await ctx.reply('Please enter a valid number of minutes (e.g., 30)')
    return
  }
  
  // Save duration to wizard state
  ctx.wizard.state.duration = minutes
  
  // Calculate points for preview (MET * minutes / 60)
  const points = Number(((ctx.wizard.state.metValue * minutes) / 60).toFixed(2))
  ctx.wizard.state.calculatedPoints = points
  
  // Move to confirmation step
  return ctx.wizard.next()
}