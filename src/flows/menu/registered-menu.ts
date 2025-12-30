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
  
  // Show content in content message
  await TwoMessageManager.updateContent(
    ctx,
    '🏠 *Welcome Back!*\n\nUse the menu below to navigate.'
  )
})