// src/flows/register/steps/1-terms.ts
import { Markup } from 'telegraf'
import { findUserByTelegramId, getGuildNames } from '../../../db'
import { TERMS_AND_CONDITIONS } from '../../../utils/texts'
import { createGuildButtons } from '../helpers/keyboard-builder'

export async function showTermsStep(ctx: any) {
  const user = await findUserByTelegramId(ctx.from.id.toString())

  if (user) {
    await ctx.reply(
      "You've already registered! You can start logging activities with /sportsactivity.",
      Markup.keyboard([['⬅️ Back to Main Menu']])
        .resize()
        .persistent()
    )
    await ctx.scene.enter('registered_menu')
    return
  }

  await ctx.reply(
    TERMS_AND_CONDITIONS,
    {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('✅ Accept', 'accept_terms')],
        [Markup.button.callback('❌ Decline', 'decline_terms')]
      ])
    }
  )
}

export async function handleTermsResponse(ctx: any): Promise<boolean> {
  // Wait for callback query
  if (!ctx.callbackQuery) {
    return false
  }

  const data = ctx.callbackQuery.data

  // Handle decline
  if (data === 'decline_terms') {
    try {
      await ctx.answerCbQuery()
      await ctx.editMessageReplyMarkup({ inline_keyboard: [] })
    } catch (error) {
      // Message might be too old to edit
    }
    
    await ctx.reply(
      'You did not accept the terms and conditions necessary to enter the competition.\n\nYou can try again from the main menu.',
      Markup.keyboard([['⬅️ Back to Main Menu']])
        .resize()
        .persistent()
    )
    await ctx.scene.enter('unregistered_menu')
    return false
  }

  // Handle accept
  if (data === 'accept_terms') {
    try {
      await ctx.answerCbQuery()
      await ctx.editMessageText('✅ You accepted the terms and conditions.')

      // Load and show guild selection
      const guilds = await getGuildNames()
      const guildRows = createGuildButtons(guilds)

      await ctx.reply('Please select your guild:', Markup.inlineKeyboard(guildRows))
      
      return true
    } catch (error) {
      console.error('Error loading guilds:', error)
      await ctx.reply('There was an error loading guilds. Please try again.')
      await ctx.scene.enter('unregistered_menu')
      return false
    }
  }

  return false
}
