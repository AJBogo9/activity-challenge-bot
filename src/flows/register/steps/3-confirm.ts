import { Markup } from 'telegraf'
import { createUser } from '../../../db'
import { escapeMarkdownV2 } from '../helpers/format'

export async function handleConfirmation(ctx: any) {
  // Wait for callback query
  if (!ctx.callbackQuery) {
    return
  }

  const data = ctx.callbackQuery.data

  // Handle cancel
  if (data === 'cancel_profile') {
    try {
      await ctx.answerCbQuery()
      await ctx.editMessageText('❌ Registration cancelled.')
    } catch (error) {
      // Message might be too old to edit
    }
    
    ctx.wizard.state.pendingUser = null
    
    await ctx.reply(
      'You can start registration again from the main menu.',
      Markup.keyboard([['⬅️ Back to Main Menu']])
        .resize()
        .persistent()
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
        await ctx.reply('Session expired. Please start registration again.')
        await ctx.scene.enter('unregistered_menu')
        return
      }

      await createUser(userData)

      try {
        await ctx.editMessageReplyMarkup({ inline_keyboard: [] })
      } catch (error) {
        // Message might be too old to edit
      }

      const escapedGuild = escapeMarkdownV2(userData.guild)

      await ctx.reply(
        `🎉 *Success\\!* You're now registered to the *${escapedGuild}* guild\\!\n\n`,
        { 
          parse_mode: 'MarkdownV2',
          ...Markup.keyboard([['⬅️ Back to Main Menu']])
            .resize()
            .persistent()
        }
      )

      // Clear wizard state
      ctx.wizard.state.pendingUser = null

      await ctx.scene.leave()
      await ctx.scene.enter('registered_menu')
    } catch (error) {
      console.error('Error creating user:', error)
      
      try {
        await ctx.editMessageText('There was an error during registration.')
      } catch (editError) {
        await ctx.reply('There was an error during registration.')
      }
      
      await ctx.reply(
        'Please try again.',
        Markup.keyboard([['⬅️ Back to Main Menu']])
          .resize()
          .persistent()
      )
      
      ctx.wizard.state.pendingUser = null
      await ctx.scene.enter('unregistered_menu')
    }
  }
}