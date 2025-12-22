import { Scenes } from 'telegraf'
import * as pointService from '../../db/point-queries'
import { formatList } from '../../utils/format-list'
import { emojis } from '../../config/constants'
import { texts } from '../../utils/texts'

/**
 * Guild comparison scene - shows detailed comparison of guilds
 * Displays both average and total points, plus member counts
 * Scene ID: 'guild_comparison'
 */
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
      const emoji = index < emojis.length ? emojis[index] : `${index + 1}\\.`
      const escapedGuild = guild.guild.replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&')
      const avgPoints = Math.round(guild.average_points * 10) / 10
      const totalPoints = Number(guild.total_points)
      const memberCount = Number(guild.member_count)
      
      message += `${emoji} *${escapedGuild}*\n`
      message += `   Average: ${avgPoints} pts\n`
      message += `   Total: ${totalPoints} pts\n`
      message += `   Members: ${memberCount}\n\n`
    })

    message += `_Total guilds: ${guilds.length}_`

    await ctx.replyWithMarkdownV2(message)
    // Don't leave the scene - stay in stats_menu so keyboard still works
  } catch (error) {
    await ctx.reply(texts.actions.error.error)
    console.error('Error in guild comparison scene:', error)
  }
})

/**
 * Guild detailed stats scene - shows side-by-side comparison
 * of average vs top 50% average
 * Scene ID: 'guild_detailed_stats'
 */
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

    // Create a map for quick lookup
    const topGuildsMap = new Map(
      topGuilds.map(g => [g.guild, g.average_points])
    )

    let message = '*🔬 Detailed Guild Statistics*\n\n'
    message += '_Avg All vs Top 50%_\n\n'
    
    allGuilds.forEach((guild: any, index: number) => {
      const emoji = index < emojis.length ? emojis[index] : `${index + 1}\\.`
      const escapedGuild = guild.guild.replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&')
      const avgAll = Math.round(guild.average_points * 10) / 10
      const avgTop = topGuildsMap.get(guild.guild)
      const avgTopStr = avgTop ? Math.round(avgTop * 10) / 10 : 'N/A'
      
      message += `${emoji} *${escapedGuild}*\n`
      message += `   All: ${avgAll} | Top 50%: ${avgTopStr}\n`
    })

    message += `\n_Shows consistency of guild performance_`

    await ctx.replyWithMarkdownV2(message)
    // Don't leave the scene - stay in stats_menu so keyboard still works
  } catch (error) {
    await ctx.reply(texts.actions.error.error)
    console.error('Error in guild detailed stats scene:', error)
  }
})