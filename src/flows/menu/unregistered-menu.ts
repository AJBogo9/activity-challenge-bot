import { Scenes } from 'telegraf'
import { TwoMessageManager } from '../../utils/two-message-manager'

export const mainMenuScene = new Scenes.BaseScene<any>('unregistered_menu')

mainMenuScene.enter(async (ctx: any) => {
  // Initialize the two-message system with unregistered user buttons
  await TwoMessageManager.init(ctx, [
    ['ℹ️ Info'],
    ['📝 Register']
  ])

  // Automatically show info menu
  await ctx.scene.enter('info_menu')
})