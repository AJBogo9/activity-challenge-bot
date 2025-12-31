import { Markup } from 'telegraf'
import { TwoMessageManager } from '../../../utils/two-message-manager'
import { addPointsToUser, createActivity, findUserByTelegramId } from '../../../db'

/**
 * Display confirmation screen with activity summary
 */
export async function showConfirmation(ctx: any): Promise<void> {
  const { 
    mainCategory, 
    subcategory,
    activity, 
    intensity, 
    activityDate, 
    duration, 
    metValue, 
    calculatedPoints 
  } = ctx.wizard.state

  if (!mainCategory || !activity || !intensity || !activityDate || !duration || !metValue) {
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

  const summary = `🔍 *Review Your Activity - Step 7/7*

📋 *Summary:*
- *Category:* ${mainCategory}${subcategory ? ` > ${subcategory}` : ''}
- *Activity:* ${activity}
- *Intensity:* ${intensity}
- *Date:* ${dateStr}
- *Duration:* ${duration} minutes
- *MET Value:* ${metValue}

🎯 *Points to be earned:* ${calculatedPoints}

_Please review the information above. Is everything correct?_`

  const keyboard = Markup.inlineKeyboard([
    [
      Markup.button.callback('❌ Cancel', 'confirm:cancel'),
      Markup.button.callback('✅ Confirm & Save', 'confirm:save')
    ]
  ])

  await TwoMessageManager.updateContent(ctx, summary, keyboard)
}

/**
 * Handle confirmation actions (save, cancel)
 */
export async function handleConfirmation(ctx: any): Promise<void> {
  // Only process callback queries
  if (!ctx.callbackQuery?.data) {
    return
  }

  const data = ctx.callbackQuery.data

  // Skip cancel - handled in wizard
  if (data === 'confirm:cancel') {
    return
  }

  // Handle save confirmation
  if (data === 'confirm:save') {
    await ctx.answerCbQuery('Saving activity...')

    const { 
      mainCategory, 
      subcategory,
      activity, 
      intensity, 
      activityDate, 
      duration, 
      metValue, 
      calculatedPoints 
    } = ctx.wizard.state

    try {
      // Find user
      const user = await findUserByTelegramId(ctx.from.id.toString())

      if (!user) {
        await TwoMessageManager.updateContent(
          ctx,
          '❌ User not found. Please register first with /start'
        )
        return ctx.scene.enter('registered_menu')
      }

      // Calculate new total points
      const oldPoints = Number(user.points || 0)
      const newTotalPoints = Number((oldPoints + calculatedPoints).toFixed(2))

      // Format activity type with hierarchy
      const activityType = subcategory 
        ? `${mainCategory} - ${subcategory} - ${activity}`
        : `${mainCategory} - ${activity}`

      // Create activity record
      await createActivity({
        userId: user.id,
        activityType,
        duration,
        points: calculatedPoints,
        description: `${intensity} intensity`,
        activityDate
      })

      // Update user points
      await addPointsToUser(user.id, calculatedPoints)

      // Format date for display
      const dateStr = activityDate instanceof Date 
        ? activityDate.toLocaleDateString() 
        : activityDate

      // Success message
      const successMessage = `✅ *Activity Logged Successfully!*

📋 *Summary:*
- *Category:* ${mainCategory}${subcategory ? ` > ${subcategory}` : ''}
- *Activity:* ${activity}
- *Intensity:* ${intensity}
- *Date:* ${dateStr}
- *Duration:* ${duration} minutes
- *MET Value:* ${metValue}

🎯 *Points Earned:* ${calculatedPoints}
📊 *Total Points:* ${newTotalPoints}

Great work! Keep it up! 💪`

      await TwoMessageManager.updateContent(ctx, successMessage)
    } catch (error) {
      console.error('Error saving activity:', error)
      await TwoMessageManager.updateContent(
        ctx,
        '❌ An error occurred while saving your activity. Please try again later.'
      )
    }

    // Return to main menu - this will reinitialize TwoMessageManager
    return ctx.scene.enter('registered_menu')
  }
}