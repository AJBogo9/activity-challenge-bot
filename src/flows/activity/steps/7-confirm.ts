import { Markup } from 'telegraf'
import { TwoMessageManager, escapeMarkdownV2 } from '../../../utils'
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
      '❌ Error: Missing activity information\\. Please start over\\.'
    )
    return
  }

  const dateStr = activityDate instanceof Date 
    ? activityDate.toLocaleDateString() 
    : activityDate

  const summary = `🔍 *Review Your Activity \\- Step 7/7*

📋 *Summary:*
\\- *Category:* ${escapeMarkdownV2(mainCategory)}${subcategory ? ` \\> ${escapeMarkdownV2(subcategory)}` : ''}
\\- *Activity:* ${escapeMarkdownV2(activity)}
\\- *Intensity:* ${escapeMarkdownV2(intensity)}
\\- *Date:* ${escapeMarkdownV2(dateStr)}
\\- *Duration:* ${duration} minutes
\\- *MET Value:* ${escapeMarkdownV2(String(metValue))}

🎯 *Points to be earned:* ${escapeMarkdownV2(String(calculatedPoints))}

_Please review the information above\\. Is everything correct?_`

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
  if (!ctx.callbackQuery?.data) {
    return
  }

  const data = ctx.callbackQuery.data

  if (data === 'confirm:cancel') {
    return
  }

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
      const user = await findUserByTelegramId(ctx.from.id.toString())

      if (!user) {
        await TwoMessageManager.updateContent(
          ctx,
          '❌ User not found\\. Please register first with /start'
        )
        return ctx.scene.enter('registered_menu')
      }

      const oldPoints = Number(user.points || 0)
      const newTotalPoints = Number((oldPoints + calculatedPoints).toFixed(2))

      const activityType = subcategory 
        ? `${mainCategory} - ${subcategory} - ${activity}`
        : `${mainCategory} - ${activity}`

      await createActivity({
        userId: user.id,
        activityType,
        duration,
        points: calculatedPoints,
        description: `${intensity} intensity`,
        activityDate
      })

      await addPointsToUser(user.id, calculatedPoints)

      const dateStr = activityDate instanceof Date 
        ? activityDate.toLocaleDateString() 
        : activityDate

      const successMessage = `✅ *Activity Logged Successfully\\!*

📋 *Summary:*
\\- *Category:* ${escapeMarkdownV2(mainCategory)}${subcategory ? ` \\> ${escapeMarkdownV2(subcategory)}` : ''}
\\- *Activity:* ${escapeMarkdownV2(activity)}
\\- *Intensity:* ${escapeMarkdownV2(intensity)}
\\- *Date:* ${escapeMarkdownV2(dateStr)}
\\- *Duration:* ${duration} minutes
\\- *MET Value:* ${escapeMarkdownV2(String(metValue))}

🎯 *Points Earned:* ${escapeMarkdownV2(String(calculatedPoints))}
📊 *Total Points:* ${escapeMarkdownV2(String(newTotalPoints))}

Great work\\! Keep it up\\! 💪`

      await TwoMessageManager.updateContent(ctx, successMessage)
    } catch (error) {
      console.error('Error saving activity:', error)
      await TwoMessageManager.updateContent(
        ctx,
        '❌ An error occurred while saving your activity\\. Please try again later\\.'
      )
    }

    return ctx.scene.enter('registered_menu')
  }
}