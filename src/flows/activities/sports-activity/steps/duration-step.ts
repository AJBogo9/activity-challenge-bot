import { Markup } from 'telegraf'
import { findUserByTelegramId, updateUserPoints } from '../../../../db/users'
import { createActivity } from '../../../../db/activities'
import { showActivityCalendar } from '../../../../utils/calendar'
import { handleCancel } from '../helpers/navigation'

export async function showDurationSelection(ctx: any) {
  const activity = ctx.wizard.state.activity
  const intensity = ctx.wizard.state.intensity
  
  // Create inline keyboard with common duration options
  await ctx.replyWithMarkdown(
    `🏃 *Log Activity - Step 6/6*\n\n*Activity:* ${activity}\n*Intensity:* ${intensity}\n*Date:* ${ctx.wizard.state.activityDate}\n*MET Value:* ${ctx.wizard.state.metValue}\n\nHow many minutes did you exercise?\n\n_Tap a quick option below or type a custom number:_`,
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

export async function handleDurationAndSave(ctx: any) {
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
        `🏃 *Log Activity - Step 5/6*\n\n*Activity:* ${activity}\n*Intensity:* ${intensity}\n*MET Value:* ${ctx.wizard.state.metValue}\n\n📅 When did you do this activity?`
      )
      
      // Show calendar again
      await showActivityCalendar(ctx)
      
      return ctx.wizard.back()
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
        `🏃 *Log Activity - Step 5/6*\n\n*Activity:* ${activity}\n*Intensity:* ${intensity}\n*MET Value:* ${ctx.wizard.state.metValue}\n\n📅 When did you do this activity?`
      )
      
      // Show calendar again
      await showActivityCalendar(ctx)
      
      return ctx.wizard.back()
    }
    
    minutes = parseInt(duration)
  } else {
    return
  }
  
  if (isNaN(minutes) || minutes <= 0) {
    await ctx.reply('Please enter a valid number of minutes (e.g., 30)')
    return
  }
  
  ctx.wizard.state.duration = minutes
  
  // Calculate points (MET * minutes / 60)
  const points = Number(((ctx.wizard.state.metValue * minutes) / 60).toFixed(2))
  
  try {
    const user = await findUserByTelegramId(ctx.from.id.toString())
    
    if (!user) {
      await ctx.reply('User not found. Please register first with /start', Markup.removeKeyboard())
      return ctx.scene.enter('registered_menu')
    }
    
    await createActivity({
      userId: user.id,
      activityType: `${ctx.wizard.state.mainCategory} - ${ctx.wizard.state.activity}`,
      duration: minutes,
      points: points,
      description: `${ctx.wizard.state.intensity} intensity`,
      activityDate: ctx.wizard.state.activityDate
    })
    
    await updateUserPoints(user.id, points)
    
    const newTotalPoints = Number(user.points || 0) + points
    
    const summary = `
✅ *Activity Logged Successfully!*

📋 *Summary:*
- *Category:* ${ctx.wizard.state.mainCategory}
- *Activity:* ${ctx.wizard.state.activity}
- *Intensity:* ${ctx.wizard.state.intensity}
- *Date:* ${ctx.wizard.state.activityDate}
- *Duration:* ${minutes} minutes
- *MET Value:* ${ctx.wizard.state.metValue}

🎯 *Points Earned:* ${points}
📊 *Total Points:* ${newTotalPoints}
`
    
    await ctx.replyWithMarkdown(summary, Markup.removeKeyboard())
    
  } catch (error) {
    console.error('Error saving activity:', error)
    await ctx.reply('❌ An error occurred while saving your activity. Please try again later.', Markup.removeKeyboard())
  }
  
  return ctx.scene.enter('registered_menu')
}