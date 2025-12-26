import { Scenes } from 'telegraf'
import * as pointService from '../../db/point-queries'
import { formatList } from '../../utils/format-list'
import { ERROR_MESSAGE } from '../../utils/texts'

function getRankPrefix(index: number): string {
  const medals = ['🥇', '🥈', '🥉']
  if (index < 3) return medals[index]
  return `${index + 1}\\.`
}

/**
 * Guild standings scene - shows average points per member
 * Scene ID: 'guild_スタンドィングス'
 */
export const guildStandingsScene = new Scenes.BaseScene<any>('guild_standings')

guildStandingsScene.enter(async (ctx: any) => {
  try {
    const guilds = await pointService.getGuildLeaderboard()

    if (!guilds || guilds.length === 0) {
      await ctx.reply("No guild statistics available yet. Guilds need at least 3 active members with points.")
      return ctx.scene.leave()
    }

    let message = '*Guild Standings \\(by average points\\)* 🏆\n\n'
    message += '_Minimum 3 active members required_\n\n'

    const guildPadding = 15
    const pointPadding = 6

    guilds.forEach((guild: any, index: number) => {
      const prefix = getRankPrefix(index)
      const escapedGuild = guild.guild.replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&')
      const points = parseFloat(guild.average_points).toFixed(1)
      const active = guild.active_members
      const total = guild.total_members
      const percent = guild.participation_percentage
      const label = `${escapedGuild} \\(${active}/${total} \\- ${percent}%\\)`
      message += prefix + formatList(label, points, guildPadding, pointPadding) + '\n'
    })

    message += `\n_Total guilds: ${guilds.length}_`

    await ctx.replyWithMarkdownV2(message)
    return ctx.scene.enter('stats_menu')
  } catch (error) {
    await ctx.reply(ERROR_MESSAGE)
    console.error('Error in guild standings scene:', error)
    return ctx.scene.enter('stats_menu')
  }
})

/**
 * Guild top 50% standings scene - shows average of top half performers
 * Scene ID: 'guild_top_standings'
 */
export const guildTopStandingsScene = new Scenes.BaseScene<any>('guild_top_standings')

guildTopStandingsScene.enter(async (ctx: any) => {
  try {
    const guilds = await pointService.getGuildTopLeaderboard()

    if (!guilds || guilds.length === 0) {
      await ctx.reply("No guild statistics available yet. Guilds need at least 3 active members with points.")
      return ctx.scene.leave()
    }

    let message = '*Guild Standings \\(top 50% average\\)* 🏆\n\n'
    message += '_Based on average of top half performers_\n'
    message += '_Minimum 3 active members required_\n\n'

    const guildPadding = 15
    const pointPadding = 6

    guilds.forEach((guild: any, index: number) => {
      const prefix = getRankPrefix(index)
      const escapedGuild = guild.guild.replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&')
      const points = parseFloat(guild.average_points).toFixed(1)
      const total = guild.total_members
      const label = `${escapedGuild} \\(${total}\\)`
      message += prefix + formatList(label, points, guildPadding, pointPadding) + '\n'
    })

    message += `\n_Total guilds: ${guilds.length}_`

    await ctx.replyWithMarkdownV2(message)
    return ctx.scene.enter('stats_menu')
  } catch (error) {
    await ctx.reply(ERROR_MESSAGE)
    console.error('Error in guild top standings scene:', error)
    return ctx.scene.enter('stats_menu')
  }
})