import { Scenes } from 'telegraf'
import { findUserByTelegramId, getActivitiesByUser } from '../../db'
import { TwoMessageManager } from '../../utils'

export const activityHistoryScene = new Scenes.BaseScene<any>('activity_history')

activityHistoryScene.enter(async (ctx: any) => {
  try {
    const user = await findUserByTelegramId(ctx.from.id.toString())

    if (!user) {
      await TwoMessageManager.updateContent(
        ctx,
        'User not found. Please register first.'
      )
      await ctx.scene.enter('registered_menu')
      return
    }

    const activities = await getActivitiesByUser(user.id)

    if (activities.length === 0) {
      const message = '📜 *Activity History*\n\nYou haven\'t logged any activities yet.'
      await TwoMessageManager.updateContent(ctx, message)
      
      if (ctx.callbackQuery) {
        await ctx.answerCbQuery()
      }
      return
    }

    // Reverse array to show oldest first, newest at bottom
    const sortedActivities = [...activities].reverse()

    let message = '📜 *Activity History*\n\n'
    sortedActivities.forEach((activity, index) => {
      message += `*${index + 1}.* ${activity.activity_type}\n`
      if (activity.duration) {
        message += `   ⏱️ Duration: ${activity.duration} min\n`
      }
      message += `   🎯 Points: ${activity.points}\n`
      if (activity.description) {
        message += `   📝 ${activity.description}\n`
      }
      message += `   📅 ${activity.activity_date}\n\n`
    })

    message += `_Total activities: ${activities.length}_`

    // Telegram has a message length limit of ~4096 characters
    if (message.length > 4000) {
      const chunks: string[] = []
      let currentChunk = '📜 *Activity History*\n\n'

      sortedActivities.forEach((activity, index) => {
        let activityText = `*${index + 1}.* ${activity.activity_type}\n`
        if (activity.duration) {
          activityText += `   ⏱️ Duration: ${activity.duration} min\n`
        }
        activityText += `   🎯 Points: ${activity.points}\n`
        if (activity.description) {
          activityText += `   📝 ${activity.description}\n`
        }
        activityText += `   📅 ${activity.activity_date}\n\n`

        if (currentChunk.length + activityText.length > 4000) {
          chunks.push(currentChunk)
          currentChunk = activityText
        } else {
          currentChunk += activityText
        }
      })

      if (currentChunk) {
        chunks.push(currentChunk + `_Total activities: ${activities.length}_`)
      }

      // Answer callback query if present
      if (ctx.callbackQuery) {
        await ctx.answerCbQuery()
      }

      // Send all chunks using updateContent (first chunk)
      await TwoMessageManager.updateContent(ctx, chunks[0])
      
      // Send remaining chunks as separate messages
      for (let i = 1; i < chunks.length; i++) {
        await ctx.replyWithMarkdown(chunks[i])
      }
    } else {
      // Single message fits - use updateContent
      await TwoMessageManager.updateContent(ctx, message)
      
      if (ctx.callbackQuery) {
        await ctx.answerCbQuery()
      }
    }
  } catch (error) {
    console.error('Error fetching activity history:', error)
    await TwoMessageManager.updateContent(
      ctx,
      '❌ An error occurred while fetching your activity history.'
    )
    await ctx.scene.enter('profile')
  }
})

// Handle reply keyboard navigation
activityHistoryScene.on('text', async (ctx: any) => {
  const handled = await TwoMessageManager.handleNavigation(ctx, ctx.message.text)
  
  if (!handled) {
    // If not a navigation button, just delete the message
    await TwoMessageManager.deleteUserMessage(ctx)
  }
})