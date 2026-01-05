import { Markup } from 'telegraf'
import { formatConfirmationMessage } from '../helpers/format'
import { TwoMessageManager } from '../../../utils'
import { isValidGuild } from '../../../config/guilds'
import { escapeMarkdownV2 } from '../../../utils'

export async function handleGuildSelection(ctx: any): Promise<boolean> {
  // Wait for callback query
  if (!ctx.callbackQuery) {
    return false
  }

  const data = ctx.callbackQuery.data

  // Handle cancel
  if (data === 'cancel_registration') {
    await ctx.answerCbQuery()
    await TwoMessageManager.updateContent(
      ctx,
      escapeMarkdownV2('❌ Registration cancelled.\n\nYou can start registration again from the main menu.')
    )
    await ctx.scene.enter('unregistered_menu')
    return false
  }

  // Handle guild selection
  const guildMatch = data.match(/^select_guild_(.+)$/)
  if (!guildMatch) {
    return false
  }

  try {
    const guild = guildMatch[1]

    // Validate guild exists in config and is active
    if (!isValidGuild(guild)) {
      await ctx.answerCbQuery('❌ Invalid guild selection')
      await TwoMessageManager.updateContent(
        ctx,
        escapeMarkdownV2('❌ The selected guild is not valid or is no longer active.\n\nPlease select a different guild.')
      )
      return false
    }

    await ctx.answerCbQuery()

    const firstName = ctx.from.first_name || ''
    const lastName = ctx.from.last_name || ''
    const username = ctx.from.username || `user_${ctx.from.id}`
    const telegramId = ctx.from.id.toString()

    // Store user data in wizard state
    ctx.wizard.state.pendingUser = {
      telegramId,
      username,
      firstName,
      lastName,
      guild,
    }

    const confirmationMessage = formatConfirmationMessage(ctx.wizard.state.pendingUser)

    await TwoMessageManager.updateContent(
      ctx,
      confirmationMessage,
      Markup.inlineKeyboard([
        [
          Markup.button.callback('❌ Cancel', 'cancel_profile'),
          Markup.button.callback('✅ Confirm', 'confirm_profile')
        ]
      ])
    )

    return true
  } catch (error) {
    console.error('Error in guild selection:', error)
    await TwoMessageManager.updateContent(
      ctx,
      escapeMarkdownV2('❌ There was an error. Please try again.')
    )
    await ctx.scene.enter('unregistered_menu')
    return false
  }
}