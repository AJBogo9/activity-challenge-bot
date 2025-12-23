import { Scenes } from 'telegraf'
import * as pointService from '../../db/point-queries'
import { texts } from '../../utils/texts'
import { escapeMarkdown } from '../../utils/format-list'

function getRankPrefix(index: number): string {
  const medals = ['🥇', '🥈', '🥉']
  if (index < 3) return medals[index]
  return `${index + 1}\\.`
}

export const guildComparisonScene = new Scenes.BaseScene<any>('guild_comparison')

guildComparisonScene.enter(async (ctx: any) => {
  try {
    const guilds = await pointService.getGuildLeaderboard()
    
    if (!guilds || guilds.length === 0) {
      await ctx.reply("No guild statistics available yet. Guilds need at least 3 active members with points.")
      return ctx.scene.leave()
    }

    let message = '*📊 Guild Comparison*\n\n'
    
    guilds.forEach((guild: any, index: number) => {
      const prefix = getRankPrefix(index)
      const escapedGuild = escapeMarkdown(guild.guild)
      const avgPoints = escapeMarkdown(Math.round(guild.average_points * 10) / 10)
      const totalPoints = escapeMarkdown(Number(guild.total_points))
      const memberCount = escapeMarkdown(Number(guild.member_count))
      
      message += `${prefix} *${escapedGuild}*\n`
      message += `   Average: ${avgPoints} pts\n`
      message += `   Total: ${totalPoints} pts\n`
      message += `   Members: ${memberCount}\n\n`
    })
    
    message += `_Total guilds: ${guilds.length}_`
    
    await ctx.replyWithMarkdownV2(message)
  } catch (error) {
    await ctx.reply(texts.actions.error.error)
    console.error('Error in guild comparison scene:', error)
  }
})

export const guildDetailedStatsScene = new Scenes.BaseScene<any>('guild_detailed_stats')

guildDetailedStatsScene.enter(async (ctx: any) => {
  try {
    const [allGuilds, topGuilds] = await Promise.all([
      pointService.getGuildLeaderboard(),
      pointService.getGuildTopLeaderboard()
    ])
    
    if (!allGuilds || allGuilds.length === 0) {
      await ctx.reply("No guild statistics available yet. Guilds need at least 3 active members with points.")
      return ctx.scene.leave()
    }

    const topGuildsMap = new Map(
      topGuilds.map(g => [g.guild, g.average_points])
    )
    
    let message = '*🔬 Detailed Guild Statistics*\n\n'
    message += '_Avg All vs Top 50%_\n\n'
    
    allGuilds.forEach((guild: any, index: number) => {
      const prefix = getRankPrefix(index)
      const escapedGuild = escapeMarkdown(guild.guild)
      const avgAll = escapeMarkdown(Math.round(guild.average_points * 10) / 10)
      const avgTop = topGuildsMap.get(guild.guild)
      const avgTopStr = avgTop ? escapeMarkdown(Math.round(avgTop * 10) / 10) : 'N/A'
      
      message += `${prefix} *${escapedGuild}*\n`
      message += `   All: ${avgAll} | Top 50%: ${avgTopStr}\n`
    })
    
    message += `\n_Shows consistency of guild performance_`
    
    await ctx.replyWithMarkdownV2(message)
  } catch (error) {
    await ctx.reply(texts.actions.error.error)
    console.error('Error in guild detailed stats scene:', error)
  }
})