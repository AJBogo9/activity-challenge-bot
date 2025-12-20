import { Scenes, Markup } from 'telegraf'

export const mainMenuScene = new Scenes.BaseScene<any>('main_menu')

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
})

// Handle Info button
mainMenuScene.hears('ℹ️ Info', async (ctx: any) => {
  await ctx.scene.enter('info_menu')
})

// Handle Register button
mainMenuScene.hears('📝 Register', async (ctx: any) => {
  await ctx.scene.enter('register_wizard')
})