import { Scenes } from 'telegraf'
import { findUserByTelegramId } from '../../db'
import { escapeMarkdownV2, TwoMessageManager } from '../../utils'

export const userProfileInfoScene = new Scenes.BaseScene<any>('user_profile_info')

userProfileInfoScene.enter(async (ctx: any) => {
  try {
    const user = await findUserByTelegramId(ctx.from.id.toString())
    
    if (!user) {
      await TwoMessageManager.updateContent(
        ctx,
        'User not found\\. Please register first\\.'
      )
      await ctx.scene.enter('registered_menu')
      return
    }

    const firstName = escapeMarkdownV2(user.first_name || '')
    const lastName = user.last_name ? ' ' + escapeMarkdownV2(user.last_name) : ''
    const username = user.username ? '@' + escapeMarkdownV2(user.username) : 'N/A'
    const guild = user.guild ? escapeMarkdownV2(user.guild) : 'None'
    const points = escapeMarkdownV2(String(user.points || 0))
    
    const summary = `📊 *User Summary*\n\n` +
      `👤 *Name:* ${firstName}${lastName}\n` +
      `🆔 *Username:* ${username}\n` +
      `🏛️ *Guild:* ${guild}\n` +
      `🎯 *Total Points:* ${points}`

    await TwoMessageManager.updateContent(ctx, summary)
    
    if (ctx.callbackQuery) {
      await ctx.answerCbQuery()
    }
  } catch (error) {
    console.error('Error fetching user summary:', error)
    await TwoMessageManager.updateContent(
      ctx,
      '❌ An error occurred while fetching your profile\\.'
    )
    await ctx.scene.enter('profile')
  }
})

// Handle reply keyboard navigation
userProfileInfoScene.on('text', async (ctx: any) => {
  const handled = await TwoMessageManager.handleNavigation(ctx, ctx.message.text)
  
  if (!handled) {
    // If not a navigation button, just delete the message
    await TwoMessageManager.deleteUserMessage(ctx)
  }
})