import { Markup } from 'telegraf'
import { formatConfirmationMessage } from '../helpers/format'

export async function handleGuildSelection(ctx: any): Promise<boolean> {
  // Wait for callback query
  if (!ctx.callbackQuery) {
    return false
  }

  const data = ctx.callbackQuery.data

  // Handle cancel
  if (data === 'cancel_registration') {
    try {
      await ctx.answerCbQuery()
      await ctx.editMessageText('❌ Registration cancelled.')
    } catch (error) {
      // Message might be too old to edit
    }
    
    await ctx.reply(
      'You can start registration again from the main menu.',
      Markup.keyboard([['⬅️ Back to Main Menu']])
        .resize()
        .persistent()
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
    await ctx.answerCbQuery()
    
    const guild = guildMatch[1]
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

    try {
      await ctx.editMessageReplyMarkup({ inline_keyboard: [] })
    } catch (error) {
      // Message might be too old to edit
    }

    const confirmationMessage = formatConfirmationMessage(ctx.wizard.state.pendingUser)

    await ctx.reply(
      confirmationMessage,
      { 
        parse_mode: 'MarkdownV2',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('✅ Confirm Registration', 'confirm_profile')],
          [Markup.button.callback('❌ Cancel', 'cancel_profile')]
        ])
      }
    )

    return true
  } catch (error) {
    console.error('Error in guild selection:', error)
    await ctx.reply('There was an error. Please try again.')
    await ctx.scene.enter('unregistered_menu')
    return false
  }
}