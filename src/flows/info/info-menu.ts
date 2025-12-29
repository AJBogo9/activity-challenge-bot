import { Scenes, Markup } from 'telegraf'

export const infoMenuScene = new Scenes.BaseScene<any>('info_menu')

// Enter the info menu - show inline keyboard
infoMenuScene.enter(async (ctx: any) => {
  const message = 'ℹ️ *Information Menu*\n\nWhat would you like to know?'
  
  const keyboard = Markup.inlineKeyboard([
    [
      Markup.button.callback('📊 Points', 'info:points'),
      Markup.button.callback('📋 Terms', 'info:terms')
    ],
    [
      Markup.button.callback('🤖 About Bot', 'info:about'),
      Markup.button.callback('👥 Credits', 'info:credits')
    ],
    [Markup.button.callback('⬅️ Back to Main Menu', 'info:back')]
  ])

  // Check if we're editing an existing message or sending a new one
  if (ctx.callbackQuery) {
    await ctx.editMessageText(message, {
      parse_mode: 'Markdown',
      ...keyboard
    })
    await ctx.answerCbQuery()
  } else {
    await ctx.replyWithMarkdown(message, keyboard)
  }
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

// Handle Credits button
infoMenuScene.action('info:credits', async (ctx: any) => {
  await ctx.answerCbQuery()
  await ctx.scene.enter('credits')
})

// Handle Back button - return to main menu
infoMenuScene.action('info:back', async (ctx: any) => {
  await ctx.answerCbQuery()
  await ctx.scene.enter('menu_router')
})

// Handle any text input - remind to use buttons
infoMenuScene.on('text', async (ctx: any) => {
  await ctx.reply('Please use the buttons above to navigate the menu.')
})