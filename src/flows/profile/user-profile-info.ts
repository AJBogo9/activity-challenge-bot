import { Scenes } from 'telegraf'
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

    await TwoMessageManager.updateContent(ctx, summary)
    
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

// Handle reply keyboard navigation
userProfileInfoScene.on('text', async (ctx: any) => {
  const handled = await TwoMessageManager.handleNavigation(ctx, ctx.message.text)
  
  if (!handled) {
    // If not a navigation button, just delete the message
    await TwoMessageManager.deleteUserMessage(ctx)
  }
})