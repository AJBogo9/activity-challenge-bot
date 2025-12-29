import { Scenes, Markup } from 'telegraf'
import { findUserByTelegramId, deleteUser } from '../../db/users'
import { ERROR_MESSAGE } from '../../utils/texts'

export const deleteUserScene = new Scenes.BaseScene<any>('delete_user_wizard')

deleteUserScene.enter(async (ctx: any) => {
  const userId = ctx.from.id.toString()
  const user = await findUserByTelegramId(userId)

  if (!user) {
    await ctx.reply('User not found. Please /register first.')
    await ctx.scene.enter('menu_router')
    return
  }

  const message = user.guild
    ? '🗑️ *Confirm User Deletion*\n\nAre you sure you want to delete your account?\n\n⚠️ This will also remove you from your guild. If your guild is left empty, it will be deleted.\n\n*This action cannot be undone.*'
    : '🗑️ *Confirm User Deletion*\n\nAre you sure you want to delete your account? This action cannot be undone.'

  const keyboard = Markup.inlineKeyboard([
    [
      Markup.button.callback('✅ Yes, delete', 'delete:confirm'),
      Markup.button.callback('❌ No, cancel', 'delete:cancel')
    ]
  ])

  // Check if we're editing an existing message or sending a new one
  if (ctx.callbackQuery) {
    await ctx.editMessageText(message, {
      parse_mode: 'Markdown',
      ...keyboard
    })
    await ctx.answerCbQuery()
  } else {
    await ctx.replyWithMarkdown(message, keyboard)
  }
})

deleteUserScene.action('delete:confirm', async (ctx: any) => {
  await ctx.answerCbQuery()
  const userId = ctx.from.id.toString()

  try {
    const user = await findUserByTelegramId(userId)

    if (!user) {
      await ctx.editMessageText('User not found or already deleted.')
      await ctx.scene.enter('menu_router')
      return
    }

    await deleteUser(userId)

    await ctx.editMessageText(
      '✅ *Account Deleted*\n\nYour account has been successfully deleted.',
      { parse_mode: 'Markdown' }
    )
    
    await ctx.scene.enter('menu_router')
  } catch (error) {
    console.error('Error deleting user:', error)
    await ctx.editMessageText(ERROR_MESSAGE)
    await ctx.scene.enter('menu_router')
  }
})

deleteUserScene.action('delete:cancel', async (ctx: any) => {
  await ctx.answerCbQuery()
  await ctx.scene.enter('profile')
})

// Handle any text input - remind to use buttons
deleteUserScene.on('text', async (ctx: any) => {
  await ctx.reply('Please use the buttons above to confirm or cancel the deletion.')
})