import { Scenes, Markup } from 'telegraf'
import { findUserByTelegramId, deleteUser } from '../../db/users'
import { ERROR_MESSAGE } from '../../utils/texts'
import { TwoMessageManager } from '../../utils/two-message-manager'

export const deleteUserScene = new Scenes.BaseScene<any>('delete_user_wizard')

deleteUserScene.enter(async (ctx: any) => {
  const userId = ctx.from.id.toString()
  const user = await findUserByTelegramId(userId)

  if (!user) {
    await TwoMessageManager.updateContent(
      ctx,
      'User not found. Please register first.',
      Markup.inlineKeyboard([
        [Markup.button.callback('⬅️ Back to Profile', 'delete:back')]
      ])
    )
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

  await TwoMessageManager.updateContent(ctx, message, keyboard)
  
  // Answer callback query if it exists
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
        'User not found or already deleted.'
      )
      
      // Wait a moment before redirecting
      await new Promise(resolve => setTimeout(resolve, 2000))
      await ctx.scene.enter('menu_router')
      return
    }

    await deleteUser(userId)

    await TwoMessageManager.updateContent(
      ctx,
      '✅ *Account Deleted*\n\nYour account has been successfully deleted.'
    )

    // Wait a moment before redirecting
    await new Promise(resolve => setTimeout(resolve, 2000))
    await ctx.scene.enter('menu_router')
  } catch (error) {
    console.error('Error deleting user:', error)
    await TwoMessageManager.updateContent(ctx, ERROR_MESSAGE)
    
    // Wait a moment before redirecting
    await new Promise(resolve => setTimeout(resolve, 2000))
    await ctx.scene.enter('menu_router')
  }
})

deleteUserScene.action('delete:cancel', async (ctx: any) => {
  await ctx.answerCbQuery()
  await ctx.scene.enter('profile')
})

// Handle any text input - delete it and remind to use buttons
deleteUserScene.on('text', async (ctx: any) => {
  await TwoMessageManager.deleteUserMessage(ctx)
  await TwoMessageManager.updateContent(
    ctx,
    '⚠️ Please use the buttons to confirm or cancel the deletion.',
    Markup.inlineKeyboard([
      [
        Markup.button.callback('✅ Yes, delete', 'delete:confirm'),
        Markup.button.callback('❌ No, cancel', 'delete:cancel')
      ]
    ])
  )
})