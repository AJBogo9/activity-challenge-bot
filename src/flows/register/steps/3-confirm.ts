import { createUser } from '../../../db'
import { escapeMarkdownV2 } from '../helpers/format'
import { TwoMessageManager } from '../../../utils/two-message-manager'

export async function handleConfirmation(ctx: any) {
  // Wait for callback query
  if (!ctx.callbackQuery) {
    return
  }

  const data = ctx.callbackQuery.data

  // Handle cancel
  if (data === 'cancel_profile') {
    await ctx.answerCbQuery()
    ctx.wizard.state.pendingUser = null
    
    await TwoMessageManager.updateContent(
      ctx,
      '❌ Registration cancelled.\n\nYou can start registration again from the main menu.'
    )
    await ctx.scene.enter('unregistered_menu')
    return
  }

  // Handle confirm
  if (data === 'confirm_profile') {
    try {
      await ctx.answerCbQuery()
      
      const userData = ctx.wizard.state.pendingUser
      if (!userData) {
        await TwoMessageManager.updateContent(
          ctx,
          '❌ Session expired. Please start registration again.'
        )
        await ctx.scene.enter('unregistered_menu')
        return
      }

      await createUser(userData)

      const escapedGuild = escapeMarkdownV2(userData.guild)
      
      await TwoMessageManager.updateContent(
        ctx,
        `🎉 *Success\\!* You're now registered to the *${escapedGuild}* guild\\!`
      )

      // Clear wizard state
      ctx.wizard.state.pendingUser = null
      
      // Leave wizard and enter registered menu
      await ctx.scene.leave()
      await ctx.scene.enter('registered_menu')
    } catch (error) {
      console.error('Error creating user:', error)
      
      await TwoMessageManager.updateContent(
        ctx,
        '❌ There was an error during registration.\n\nPlease try again.'
      )
      
      ctx.wizard.state.pendingUser = null
      await ctx.scene.enter('unregistered_menu')
    }
  }
}