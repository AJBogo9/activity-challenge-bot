import { Markup } from 'telegraf'
import { findUserByTelegramId, updateUserPoints } from '../../../../db/users'
import { createActivity } from '../../../../db/activities'
import { handleCancel } from '../helpers/navigation'
import { showDurationSelection } from './6-duration'

export async function showConfirmation(ctx: any) {
  const { mainCategory, activity, intensity, activityDate, duration, metValue, calculatedPoints } = ctx.wizard.state
  
  const summary = `
🔍 *Review Your Activity - Step 7/7*

📋 *Summary:*
- *Category:* ${mainCategory}
- *Activity:* ${activity}
- *Intensity:* ${intensity}
- *Date:* ${activityDate}
- *Duration:* ${duration} minutes
- *MET Value:* ${metValue}

🎯 *Points to be earned:* ${calculatedPoints}

_Please review the information above. Is everything correct?_
`
  
  await ctx.replyWithMarkdown(
    summary,
    Markup.inlineKeyboard([
      [
        Markup.button.callback('✅ Confirm & Save', 'confirm:save'),
      ],
      [
        Markup.button.callback('⬅️ Back to Duration', 'confirm:back'),
        Markup.button.callback('❌ Cancel', 'confirm:cancel')
      ]
    ])
  )
}

export async function handleConfirmation(ctx: any) {
  if (!ctx.callbackQuery?.data) {
    return
  }
  
  const data = ctx.callbackQuery.data
  
  if (data === 'confirm:cancel') {
    await ctx.answerCbQuery()
    return handleCancel(ctx)
  }
  
  if (data === 'confirm:back') {
    await ctx.answerCbQuery()
    
    // Clear duration and points from state
    delete ctx.wizard.state.duration
    delete ctx.wizard.state.calculatedPoints
    
    // Go back to duration step (step index 4)
    ctx.wizard.selectStep(4)
    
    // Show duration selection again
    return showDurationSelection(ctx)
  }
  
  if (data === 'confirm:save') {
    await ctx.answerCbQuery('Saving activity...')
    
    const { mainCategory, activity, intensity, activityDate, duration, metValue, calculatedPoints } = ctx.wizard.state
    
    try {
      const user = await findUserByTelegramId(ctx.from.id.toString())
      
      if (!user) {
        await ctx.reply('User not found. Please register first with /start', Markup.removeKeyboard())
        return ctx.scene.enter('registered_menu')
      }
      
      // Calculate new total before update
      const oldPoints = Number(user.points || 0)
      const newTotalPoints = Number((oldPoints + calculatedPoints).toFixed(2))
      
      // Create activity record
      await createActivity({
        userId: user.id,
        activityType: `${mainCategory} - ${activity}`,
        duration: duration,
        points: calculatedPoints,
        description: `${intensity} intensity`,
        activityDate: activityDate
      })
      
      // Update user points
      await updateUserPoints(user.id, calculatedPoints)
      
      const successMessage = `
✅ *Activity Logged Successfully!*

📋 *Summary:*
- *Category:* ${mainCategory}
- *Activity:* ${activity}
- *Intensity:* ${intensity}
- *Date:* ${activityDate}
- *Duration:* ${duration} minutes
- *MET Value:* ${metValue}

🎯 *Points Earned:* ${calculatedPoints}
📊 *Total Points:* ${newTotalPoints}
`
      
      await ctx.replyWithMarkdown(successMessage, Markup.removeKeyboard())
      
    } catch (error) {
      console.error('Error saving activity:', error)
      await ctx.reply('❌ An error occurred while saving your activity. Please try again later.', Markup.removeKeyboard())
    }
    
    return ctx.scene.enter('registered_menu')
  }
}