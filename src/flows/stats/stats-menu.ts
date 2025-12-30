import { Scenes, Markup } from 'telegraf'
import { PersistentMenu } from '../../utils/persistent-menu'

export const statsMenuScene = new Scenes.BaseScene<any>('stats_menu')

statsMenuScene.enter(async (ctx: any) => {
  const message = `📊 *Statistics Menu*
Choose what statistics you'd like to view:`
  
  const keyboard = Markup.inlineKeyboard([
    [
      Markup.button.callback('👤 My Summary', 'stats:summary'),
      Markup.button.callback('🏆 Top Users', 'stats:top')
    ],
    [
      Markup.button.callback('🏛️ Guild vs Guild', 'stats:guilds'),
      Markup.button.callback('⚔️ Guild Leaderboard', 'stats:compare')
    ],
    [Markup.button.callback('🔙 Back to Main Menu', 'stats:back')]
  ])

  await PersistentMenu.updateSubmenu(ctx, message, keyboard)
})

// Handle My Summary button
statsMenuScene.action('stats:summary', async (ctx: any) => {
  await ctx.answerCbQuery()
  await ctx.scene.enter('user_summary')
})

// Handle Top Users button
statsMenuScene.action('stats:top', async (ctx: any) => {
  await ctx.answerCbQuery()
  await ctx.scene.enter('top_users')
})

// Handle Guild Leaderboard button
statsMenuScene.action('stats:guilds', async (ctx: any) => {
  await ctx.answerCbQuery()
  await ctx.scene.enter('guild_leaderboard')
})

// Handle Guild Comparison button
statsMenuScene.action('stats:compare', async (ctx: any) => {
  await ctx.answerCbQuery()
  await ctx.scene.enter('guild_comparison')
})

// Handle Back button - return to main menu
statsMenuScene.action('stats:back', async (ctx: any) => {
  await ctx.answerCbQuery()
  await PersistentMenu.deleteSubmenu(ctx)
  await ctx.scene.enter('registered_menu')
})