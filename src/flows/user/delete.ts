import { Scenes, Markup } from 'telegraf'
import { findUserByTelegramId, deleteUser } from '../../db/users'
import { ERROR_MESSAGE } from '../../utils/texts'

export const deleteUserWizard = new Scenes.WizardScene(
  'delete_user_wizard',
  async (ctx: any) => {
    const userId = ctx.from.id.toString()
    const user = await findUserByTelegramId(userId)
    
    if (!user) {
      await ctx.reply('User not found. Please /register first.')
      return ctx.scene.leave()
    }
    
    let message = 'Confirm user deletion? This action cannot be undone.'
    if (user.team_id) {
      message = 'Confirm user deletion? This action will also remove you from your current team. If your team is left empty, it will be deleted. This cannot be undone.'
    }
    
    await ctx.reply(
      message,
      Markup.inlineKeyboard([
        Markup.button.callback('Yes, delete', 'confirm_delete'),
        Markup.button.callback('No, cancel', 'cancel_delete')
      ])
    )
    return ctx.wizard.next()
  },
  async (ctx: any) => {
    // Validate that user clicked a button instead of sending a message
    if (ctx.updateType === 'message') {
      await ctx.reply('Please use the provided buttons to select an option.')
      return
    }
  }
)

deleteUserWizard.action('confirm_delete', async (ctx: any) => {
  const userId = ctx.from.id.toString()
  
  try {
    const user = await findUserByTelegramId(userId)
    if (!user) {
      await ctx.editMessageText('User not found or already deleted.')
      return ctx.scene.leave()
    }
    
    // Store team_id before deletion
    const teamId = user.team_id
    
    // Delete the user
    await deleteUser(userId)
    
    await ctx.editMessageText('User deleted successfully. You can register again using /register.')
  } catch (error) {
    console.error('Error deleting user:', error)
    await ctx.editMessageText(ERROR_MESSAGE)
  }
  
  return ctx.scene.leave()
})

deleteUserWizard.action('cancel_delete', async (ctx: any) => {
  await ctx.editMessageText('Deletion canceled.')
  return ctx.scene.leave()
})