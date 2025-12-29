import { Scenes, Markup } from 'telegraf'
import { findUserByTelegramId } from '../../db/users'

export const userProfileInfoScene = new Scenes.BaseScene<any>('user_profile_info')

userProfileInfoScene.enter(async (ctx: any) => {
  try {
    const user = await findUserByTelegramId(ctx.from.id.toString())

    if (!user) {
      await ctx.reply('User not found. Please register first.')
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

    // Check if we're editing an existing message or sending a new one
    if (ctx.callbackQuery) {
      await ctx.editMessageText(summary, {
        parse_mode: 'Markdown',
        ...keyboard
      })
      await ctx.answerCbQuery()
    } else {
      await ctx.replyWithMarkdown(summary, keyboard)
    }
  } catch (error) {
    console.error('Error fetching user summary:', error)
    await ctx.reply('An error occurred while fetching your profile.')
    await ctx.scene.enter('profile')
  }
})

userProfileInfoScene.action('user_profile_info:back', async (ctx: any) => {
  await ctx.answerCbQuery()
  await ctx.scene.enter('profile')
})

// Handle any text input - remind to use buttons
userProfileInfoScene.on('text', async (ctx: any) => {
  await ctx.reply('Please use the buttons above to navigate.')
})