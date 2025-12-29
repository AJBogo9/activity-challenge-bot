import { Markup } from 'telegraf'
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
    await ctx.reply('❌ Error: Missing activity information. Please start over.')
    return
  }

  // Format date for display
  const dateStr = activityDate instanceof Date 
    ? activityDate.toLocaleDateString() 
    : activityDate

  const summary = `
🔍 *Review Your Activity - Step 7/7*

📋 *Summary:*
- *Category:* ${mainCategory}${subcategory ? ` > ${subcategory}` : ''}
- *Activity:* ${activity}
- *Intensity:* ${intensity}
- *Date:* ${dateStr}
- *Duration:* ${duration} minutes
- *MET Value:* ${metValue}

🎯 *Points to be earned:* ${calculatedPoints}

_Please review the information above. Is everything correct?_
`

  // Try to edit the existing message
  try {
    await ctx.editMessageText(
      summary,
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [
            Markup.button.callback('✅ Confirm & Save', 'confirm:save'),
          ],
          [
            Markup.button.callback('❌ Cancel', 'confirm:cancel')
          ]
        ])
      }
    )
  } catch (error) {
    // If editing fails, send a new message
    await ctx.replyWithMarkdown(
      summary,
      Markup.inlineKeyboard([
        [
          Markup.button.callback('✅ Confirm & Save', 'confirm:save'),
        ],
        [
          Markup.button.callback('❌ Cancel', 'confirm:cancel')
        ]
      ])
    )
  }
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
        await ctx.editMessageText(
          '❌ User not found. Please register first with /start',
          { parse_mode: 'Markdown' }
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
      const successMessage = `
✅ *Activity Logged Successfully!*

📋 *Summary:*
- *Category:* ${mainCategory}${subcategory ? ` > ${subcategory}` : ''}
- *Activity:* ${activity}
- *Intensity:* ${intensity}
- *Date:* ${dateStr}
- *Duration:* ${duration} minutes
- *MET Value:* ${metValue}

🎯 *Points Earned:* ${calculatedPoints}
📊 *Total Points:* ${newTotalPoints}

Great work! Keep it up! 💪
`

      await ctx.editMessageText(successMessage, { parse_mode: 'Markdown' })
    } catch (error) {
      console.error('Error saving activity:', error)
      await ctx.editMessageText(
        '❌ An error occurred while saving your activity. Please try again later.',
        { parse_mode: 'Markdown' }
      )
    }

    // Return to main menu
    return ctx.scene.enter('registered_menu')
  }
}