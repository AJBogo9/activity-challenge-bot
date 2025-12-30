import { Scenes, Markup } from 'telegraf'

export const mainMenuScene = new Scenes.BaseScene<any>('unregistered_menu')

mainMenuScene.enter(async (ctx: any) => {
  const message = '🏠 *Main Menu*\n\nChoose an option:'
  
  await ctx.replyWithMarkdown(
    message,
    Markup.keyboard([
      ['ℹ️ Info'],
      ['📝 Register']
    ])
      .resize()
      .persistent()
  )
  
  // Automatically show info menu
  await ctx.scene.enter('info_menu')
})