import { Scenes, Markup } from 'telegraf'
import { findUserByTelegramId } from '../../db/users'
import { TwoMessageManager } from '../../utils/two-message-manager'

export const userProfileInfoScene = new Scenes.BaseScene<any>('user_profile_info')

userProfileInfoScene.enter(async (ctx: any) => {
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

    const summary = `📊 *User Summary*

👤 *Name:* ${user.first_name}${user.last_name ? ' ' + user.last_name : ''}
🆔 *Username:* ${user.username ? '@' + user.username : 'N/A'}
🏛️ *Guild:* ${user.guild || 'None'}
🎯 *Total Points:* ${user.points || 0}`

    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('⬅️ Back to Profile', 'user_profile_info:back')]
    ])

    await TwoMessageManager.updateContent(ctx, summary, keyboard)

    if (ctx.callbackQuery) {
      await ctx.answerCbQuery()
    }
  } catch (error) {
    console.error('Error fetching user summary:', error)
    await TwoMessageManager.updateContent(
      ctx,
      '❌ An error occurred while fetching your profile.'
    )
    await ctx.scene.enter('profile')
  }
})

userProfileInfoScene.action('user_profile_info:back', async (ctx: any) => {
  await ctx.answerCbQuery()
  await ctx.scene.enter('profile')
})

// Handle any text input - delete it silently
userProfileInfoScene.on('text', async (ctx: any) => {
  await TwoMessageManager.deleteUserMessage(ctx)
})