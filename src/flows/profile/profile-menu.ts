import { Scenes, Markup } from 'telegraf'
import { PersistentMenu } from '../../utils/persistent-menu'

export const profileScene = new Scenes.BaseScene<any>('profile')

// Enter the profile menu - show inline keyboard
profileScene.enter(async (ctx: any) => {
  const message = '👤 *Profile*\n\nWhat would you like to view?'
  const keyboard = Markup.inlineKeyboard([
    [
      Markup.button.callback('📊 User Summary', 'profile:summary'),
      Markup.button.callback('📜 Activity History', 'profile:history')
    ],
    [Markup.button.callback('🗑️ Delete Account', 'profile:delete')],
    [Markup.button.callback('⬅️ Back to Main Menu', 'profile:back')]
  ])

  await PersistentMenu.updateSubmenu(ctx, message, keyboard)
})

// Handle User Summary - navigate to separate scene
profileScene.action('profile:summary', async (ctx: any) => {
  await ctx.answerCbQuery()
  await ctx.scene.enter('user_profile_info')
})

// Handle Activity History - navigate to separate scene
profileScene.action('profile:history', async (ctx: any) => {
  await ctx.answerCbQuery()
  await ctx.scene.enter('activity_history')
})

// Handle Delete Account - navigate to delete wizard
profileScene.action('profile:delete', async (ctx: any) => {
  await ctx.answerCbQuery()
  await ctx.scene.enter('delete_user_wizard')
})

// Handle Back to Main Menu
profileScene.action('profile:back', async (ctx: any) => {
  await ctx.answerCbQuery()
  await PersistentMenu.deleteSubmenu(ctx)
  await ctx.scene.enter('menu_router')
})

// Register reply keyboard handlers for cross-menu navigation
PersistentMenu.registerReplyKeyboardHandlers(profileScene, 'profile')

// Handle any other text input - remind to use buttons
profileScene.on('text', async (ctx: any) => {
  await ctx.reply('Please use the buttons above to navigate the menu.')
})