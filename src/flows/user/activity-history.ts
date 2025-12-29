import { Scenes, Markup } from 'telegraf'
import { findUserByTelegramId } from '../../db/users'
import { getActivitiesByUser } from '../../db/activities'

export const activityHistoryScene = new Scenes.BaseScene<any>('activity_history')

activityHistoryScene.enter(async (ctx: any) => {
  try {
    const user = await findUserByTelegramId(ctx.from.id.toString())

    if (!user) {
      await ctx.reply('User not found. Please register first.')
      await ctx.scene.enter('registered_menu')
      return
    }

    const activities = await getActivitiesByUser(user.id)
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('⬅️ Back to Profile', 'activity_history:back')]
    ])

    if (activities.length === 0) {
      const message = '📜 *Activity History*\n\nYou haven\'t logged any activities yet.'

      if (ctx.callbackQuery) {
        await ctx.editMessageText(message, {
          parse_mode: 'Markdown',
          ...keyboard
        })
        await ctx.answerCbQuery()
      } else {
        await ctx.replyWithMarkdown(message, keyboard)
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

      // If entering from callback, delete the original message first
      if (ctx.callbackQuery) {
        try {
          await ctx.deleteMessage()
        } catch (error) {
          // Message might already be deleted, ignore error
        }
        await ctx.answerCbQuery()
      }

      // Send all chunks
      for (let i = 0; i < chunks.length; i++) {
        if (i === chunks.length - 1) {
          // Add keyboard only to the last chunk
          await ctx.replyWithMarkdown(chunks[i], keyboard)
        } else {
          await ctx.replyWithMarkdown(chunks[i])
        }
      }
    } else {
      // Check if we're editing an existing message or sending a new one
      if (ctx.callbackQuery) {
        await ctx.editMessageText(message, {
          parse_mode: 'Markdown',
          ...keyboard
        })
        await ctx.answerCbQuery()
      } else {
        await ctx.replyWithMarkdown(message, keyboard)
      }
    }
  } catch (error) {
    console.error('Error fetching activity history:', error)
    await ctx.reply('An error occurred while fetching your activity history.')
    await ctx.scene.enter('profile')
  }
})

activityHistoryScene.action('activity_history:back', async (ctx: any) => {
  await ctx.answerCbQuery()
  await ctx.scene.enter('profile')
})

// Handle any text input - remind to use buttons
activityHistoryScene.on('text', async (ctx: any) => {
  await ctx.reply('Please use the buttons above to navigate.')
})