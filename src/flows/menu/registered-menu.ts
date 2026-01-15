import { Scenes } from 'telegraf'
import { TwoMessageManager } from '../../utils'

export const registeredMenuScene = new Scenes.BaseScene<any>('registered_menu')

registeredMenuScene.enter(async (ctx: any) => {
  // Initialize with default registered user buttons
  await TwoMessageManager.init(ctx)
  
  // Automatically show info menu
  await ctx.scene.enter('info_menu')
})