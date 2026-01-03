import { Markup } from 'telegraf'
import { findUserByTelegramId, getGuildNames } from '../../../db'
import { createGuildButtons } from '../helpers/keyboard-builder'
import { TERMS_AND_CONDITIONS, TwoMessageManager } from '../../../utils'

export async function showTermsStep(ctx: any) {
  const user = await findUserByTelegramId(ctx.from.id.toString())
  
  if (user) {
    await ctx.reply("You've already registered! You can start logging activities.")
    await ctx.scene.enter('registered_menu')
    return
  }

  const keyboard = Markup.inlineKeyboard([
    [
      Markup.button.callback('❌ Decline', 'decline_terms'), 
      Markup.button.callback('✅ Accept', 'accept_terms')
    ],
  ])

  await TwoMessageManager.updateContent(ctx, TERMS_AND_CONDITIONS, keyboard)
}

export async function handleTermsResponse(ctx: any): Promise<boolean> {
  // Wait for callback query
  if (!ctx.callbackQuery) {
    return false
  }

  const data = ctx.callbackQuery.data

  // Handle decline
  if (data === 'decline_terms') {
    await ctx.answerCbQuery()
    await TwoMessageManager.updateContent(
      ctx,
      '❌ You declined the terms and conditions.\n\nYou can try again from the main menu.'
    )
    await ctx.scene.enter('unregistered_menu')
    return false
  }

  // Handle accept
  if (data === 'accept_terms') {
    try {
      await ctx.answerCbQuery()
      
      // Load and show guild selection
      const guilds = await getGuildNames()
      const guildRows = createGuildButtons(guilds)
      
      await TwoMessageManager.updateContent(
        ctx,
        '✅ Terms accepted!\n\n*Please select your guild:*',
        Markup.inlineKeyboard(guildRows)
      )
      
      return true
    } catch (error) {
      console.error('Error loading guilds:', error)
      await TwoMessageManager.updateContent(
        ctx,
        '❌ There was an error loading guilds. Please try again.'
      )
      await ctx.scene.enter('unregistered_menu')
      return false
    }
  }

  return false
}