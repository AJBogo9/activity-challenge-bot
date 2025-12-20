import { Scenes, Markup } from 'telegraf'

export const infoMenuScene = new Scenes.BaseScene<any>('info_menu')

infoMenuScene.enter(async (ctx: any) => {
  const message = 'ℹ️ *Information Menu*\n\nWhat would you like to know?'
  
  await ctx.replyWithMarkdown(
    message,
    Markup.keyboard([
      ['❓ Help'],
      ['📊 How Points Work', '📈 Stats Info'],
      ['📋 Terms', '👥 Credits'],
      ['⬅️ Back to Main Menu']
    ])
      .resize()
      .persistent()
  )
})

// Handle Help button
infoMenuScene.hears('❓ Help', async (ctx: any) => {
  await ctx.scene.enter('help_scene')
})

// Handle How Points Work button
infoMenuScene.hears('📊 How Points Work', async (ctx: any) => {
  await ctx.scene.enter('how_to_get_points_scene')
})

// Handle Terms button
infoMenuScene.hears('📋 Terms', async (ctx: any) => {
  await ctx.scene.enter('terms_scene')
})

// Handle Stats Info button
infoMenuScene.hears('📈 Stats Info', async (ctx: any) => {
  await ctx.scene.enter('stats_info_scene')
})

// Handle Credits button
infoMenuScene.hears('👥 Credits', async (ctx: any) => {
  await ctx.scene.enter('credits')
})

// Handle Back button - use router to go to correct menu
infoMenuScene.hears('⬅️ Back to Main Menu', async (ctx: any) => {
  await ctx.scene.enter('menu_router')
})