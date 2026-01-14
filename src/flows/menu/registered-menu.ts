import { Scenes } from 'telegraf'
import { TwoMessageManager } from '../../utils'

export const registeredMenuScene = new Scenes.BaseScene<any>('registered_menu')

registeredMenuScene.enter(async (ctx: any) => {
  // Initialize with default registered user buttons (no need to pass them explicitly)
  await TwoMessageManager.init(ctx)
  
  // Automatically show info menu using centralized navigation
  await TwoMessageManager.enterScene(ctx, 'info_menu')
})