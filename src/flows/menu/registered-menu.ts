import { Scenes, Markup } from 'telegraf'
import { PersistentMenu } from '../../utils/persistent-menu'

export const registeredMenuScene = new Scenes.BaseScene<any>('registered_menu')

registeredMenuScene.enter(async (ctx: any) => {
  const message = '🏠 *Main Menu*\n\nWhat would you like to do?'
  
  await ctx.replyWithMarkdown(
    message,
    Markup.keyboard([
      ['👤 Profile', '💪 Log Activity'],
      ['📊 Statistics', 'ℹ️ Info'],
      ['💬 Feedback']
    ])
      .resize()
      .persistent()
  )
  
  // Automatically show info menu
  await ctx.scene.enter('info_menu')
})