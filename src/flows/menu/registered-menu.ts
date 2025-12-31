import { Scenes } from 'telegraf'
import { TwoMessageManager } from '../../utils/two-message-manager'

export const registeredMenuScene = new Scenes.BaseScene<any>('registered_menu')

registeredMenuScene.enter(async (ctx: any) => {
  // Initialize the two-message system with the registered user buttons
  await TwoMessageManager.init(ctx, [
    ['👤 Profile', '💪 Log Activity'],
    ['📊 Statistics', 'ℹ️ Info'],
    ['💬 Feedback']
  ])
  
  // Automatically show info menu
  await ctx.scene.enter('info_menu')
})