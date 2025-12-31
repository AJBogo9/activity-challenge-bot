import { Scenes, Markup } from 'telegraf'
import { TwoMessageManager } from '../../utils'

export const profileScene = new Scenes.BaseScene<any>('profile')

// Enter the profile menu - show inline keyboard
profileScene.enter(async (ctx: any) => {
  const message = '👤 *Profile*\n\nWhat would you like to view?'
  
  const keyboard = Markup.inlineKeyboard([
    [
      Markup.button.callback('📊 User Summary', 'profile:summary'),
      Markup.button.callback('📜 Activity History', 'profile:history')
    ],
    [Markup.button.callback('🗑️ Delete Account', 'profile:delete')]
  ])

  await TwoMessageManager.updateContent(ctx, message, keyboard)
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