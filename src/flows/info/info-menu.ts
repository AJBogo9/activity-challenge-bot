import { Scenes, Markup } from 'telegraf'
import { TwoMessageManager } from '../../utils'

export const infoMenuScene = new Scenes.BaseScene<any>('info_menu')

infoMenuScene.enter(async (ctx: any) => {
  const message = 'ℹ️ *Information Menu*\n\nWhat would you like to know?'
  
  const keyboard = Markup.inlineKeyboard([
    [
      Markup.button.callback('📊 Points', 'info:points'),
      Markup.button.callback('📋 Terms', 'info:terms')
    ],
    [
      Markup.button.callback('🤖 About Bot', 'info:about'),
      // Markup.button.callback('👥 Credits', 'info:credits')
    ]
  ])

  await TwoMessageManager.updateContent(ctx, message, keyboard)
})

// Handle How Points Work button
infoMenuScene.action('info:points', async (ctx: any) => {
  await ctx.answerCbQuery()
  await ctx.scene.enter('how_to_get_points_scene')
})

// Handle Terms button
infoMenuScene.action('info:terms', async (ctx: any) => {
  await ctx.answerCbQuery()
  await ctx.scene.enter('terms_scene')
})

// Handle About Bot button
infoMenuScene.action('info:about', async (ctx: any) => {
  await ctx.answerCbQuery()
  await ctx.scene.enter('about_bot_scene')
})

// // Handle Credits button
// infoMenuScene.action('info:credits', async (ctx: any) => {
//   await ctx.answerCbQuery()
//   await ctx.scene.enter('credits')
// })