import { Scenes, Markup } from 'telegraf'

export const registeredMenuScene = new Scenes.BaseScene<any>('registered_menu')

registeredMenuScene.enter(async (ctx: any) => {
  const message = '🏠 *Main Menu*\n\nWhat would you like to do?'
  
  await ctx.replyWithMarkdown(
    message,
    Markup.keyboard([
      ['👤 Profile', '💪 Log Activity'],
      ['📊 Statistics', 'ℹ️ Info']
    ])
      .resize()
      .persistent()
  )
})

// Handle Profile button - Enter the profile scene
registeredMenuScene.hears('👤 Profile', async (ctx: any) => {
  return ctx.scene.enter('profile')
})

// Handle Log Activity button - Enter the sports activity wizard
registeredMenuScene.hears('💪 Log Activity', async (ctx: any) => {
  return ctx.scene.enter('sports_activity_wizard')
})

// Handle Statistics button - Enter the stats menu
registeredMenuScene.hears('📊 Statistics', async (ctx: any) => {
  return ctx.scene.enter('stats_menu')
})

// Handle Info button - reuse existing info menu
registeredMenuScene.hears('ℹ️ Info', async (ctx: any) => {
  return ctx.scene.enter('info_menu')
})

// Handle any other text input
registeredMenuScene.on('text', async (ctx: any) => {
  await ctx.reply('Please use the buttons below to navigate the menu.')
})