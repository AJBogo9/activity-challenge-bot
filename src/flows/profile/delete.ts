import { Scenes, Markup } from 'telegraf'
import { findUserByTelegramId, deleteUser } from '../../db'
import { ERROR_MESSAGE, TwoMessageManager } from '../../utils'

export const deleteUserScene = new Scenes.BaseScene<any>('delete_user_wizard')

deleteUserScene.enter(async (ctx: any) => {
  const userId = ctx.from.id.toString()
  const user = await findUserByTelegramId(userId)

  if (!user) {
    await TwoMessageManager.updateContent(
      ctx,
      'User not found\\. Please register first\\.'
    )
    return
  }

  const message = user.guild
    ? '🗑️ *Confirm User Deletion*\n\nAre you sure you want to delete your account?\n\n⚠️ This will also remove you from your guild\\. If your guild is left empty, it will be deleted\\.\n\n*This action cannot be undone\\.*'
    : '🗑️ *Confirm User Deletion*\n\nAre you sure you want to delete your account? This action cannot be undone\\.'

  const keyboard = Markup.inlineKeyboard([
    [
      Markup.button.callback('❌ No, cancel', 'delete:cancel'),
      Markup.button.callback('✅ Yes, delete', 'delete:confirm')
    ]
  ])

  await TwoMessageManager.updateContent(ctx, message, keyboard)

  if (ctx.callbackQuery) {
    await ctx.answerCbQuery()
  }
})

deleteUserScene.action('delete:confirm', async (ctx: any) => {
  await ctx.answerCbQuery()
  const userId = ctx.from.id.toString()

  try {
    const user = await findUserByTelegramId(userId)
    
    if (!user) {
      await TwoMessageManager.updateContent(
        ctx,
        'User not found or already deleted\\.'
      )
      await new Promise(resolve => setTimeout(resolve, 2000))
      await ctx.scene.enter('menu_router')
      return
    }

    await deleteUser(userId)

    await TwoMessageManager.updateContent(
      ctx,
      '✅ *Account Deleted*\n\nYour account has been successfully deleted\\.'
    )

    await new Promise(resolve => setTimeout(resolve, 2000))
    await ctx.scene.enter('menu_router')
  } catch (error) {
    console.error('Error deleting user:', error)
    await TwoMessageManager.updateContent(ctx, ERROR_MESSAGE)
    await new Promise(resolve => setTimeout(resolve, 2000))
    await ctx.scene.enter('menu_router')
  }
})

deleteUserScene.action('delete:cancel', async (ctx: any) => {
  await ctx.answerCbQuery()
  await ctx.scene.enter('profile')
})