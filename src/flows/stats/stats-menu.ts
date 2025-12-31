import { Scenes, Markup } from 'telegraf'
import { TwoMessageManager } from '../../utils/two-message-manager'

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
      Markup.button.callback('🏆 Guild Rankings', 'stats:guild_rankings'),
      Markup.button.callback('👥 My Guild', 'stats:my_guild')
    ]
  ])

  await TwoMessageManager.updateContent(ctx, message, keyboard)
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

// Handle Guild Rankings button (Guild vs Guild)
statsMenuScene.action('stats:guild_rankings', async (ctx: any) => {
  await ctx.answerCbQuery()
  await ctx.scene.enter('guild_rankings')
})

// Handle My Guild button (Guild inner leaderboard)
statsMenuScene.action('stats:my_guild', async (ctx: any) => {
  await ctx.answerCbQuery()
  await ctx.scene.enter('my_guild_leaderboard')
})