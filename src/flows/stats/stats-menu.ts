import { Scenes, Markup } from 'telegraf'

export const statsMenuScene = new Scenes.BaseScene<any>('stats_menu')

statsMenuScene.enter(async (ctx: any) => {
  const message = `📊 *Statistics Menu*

Choose what statistics you'd like to view:`

  await ctx.replyWithMarkdown(
    message,
    Markup.keyboard([
      ['👤 My Summary', '🏆 Top Users'],
      ['👥 Team Rankings', '👨‍👩‍👧‍👦 Team Members'],
      ['🏛️ Guild Standings', '⚔️ Guild Comparison'],
      ['🔙 Back to Main Menu']
    ])
      .resize()
      .persistent()
  )
})

// My Summary - Personal stats
statsMenuScene.hears('👤 My Summary', async (ctx: any) => {
  return ctx.scene.enter('user_summary')
})

// Top Users - Overall leaderboard
statsMenuScene.hears('🏆 Top Users', async (ctx: any) => {
  return ctx.scene.enter('top_users')
})

// Team Rankings - Team leaderboard
statsMenuScene.hears('👥 Team Rankings', async (ctx: any) => {
  return ctx.scene.enter('team_rankings')
})

// Team Members - View your team's members
statsMenuScene.hears('👨‍👩‍👧‍👦 Team Members', async (ctx: any) => {
  return ctx.scene.enter('team_members')
})

// Guild Standings - Overall guild rankings
statsMenuScene.hears('🏛️ Guild Standings', async (ctx: any) => {
  return ctx.scene.enter('guild_standings')
})

// Guild Comparison - Compare guilds
statsMenuScene.hears('⚔️ Guild Comparison', async (ctx: any) => {
  return ctx.scene.enter('guild_comparison')
})

// Back to Main Menu
statsMenuScene.hears('🔙 Back to Main Menu', async (ctx: any) => {
  return ctx.scene.enter('registered_menu')
})

// Handle any other text input
statsMenuScene.on('text', async (ctx: any) => {
  await ctx.reply('Please use the buttons below to navigate the statistics menu.')
})