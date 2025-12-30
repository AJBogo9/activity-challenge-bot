import { Scenes } from 'telegraf'
import { TwoMessageManager } from '../../utils/two-message-manager'

export const mainMenuScene = new Scenes.BaseScene<any>('unregistered_menu')

mainMenuScene.enter(async (ctx: any) => {
  // Initialize the two-message system for unregistered users
  await TwoMessageManager.init(ctx)
  
  // Update keyboard for unregistered state
  await TwoMessageManager.updateKeyboard(ctx, [
    ['ℹ️ Info'],
    ['📝 Register']
  ])
  
  // Automatically show info menu
  await ctx.scene.enter('info_menu')
})