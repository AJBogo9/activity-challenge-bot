import { Scenes } from 'telegraf'
import { getGuildLeaderboard } from '../../db'
import { formatList, ERROR_MESSAGE, TwoMessageManager } from '../../utils'

function getRankPrefix(index: number): string {
  const medals = ['🥇', '🥈', '🥉']
  if (index < 3) return medals[index]
  return `${index + 1}\\.`
}

/**
 * Guild rankings scene - shows guilds ranked by average points per member
 * This is for Guild vs Guild comparison
 * Scene ID: 'guild_rankings'
 */
export const guildRankingsScene = new Scenes.BaseScene<any>('guild_rankings')

guildRankingsScene.enter(async (ctx: any) => {
  try {
    const guilds = await getGuildLeaderboard()

    let message = '*🏆 Guild Rankings*\n'
    message += '_Ranked by average points per member_\n\n'
    
    const guildPadding = 15
    const pointPadding = 6

    guilds.forEach((guild: any, index: number) => {
      const prefix = getRankPrefix(index)
      const escapedGuild = guild.guild.replace(/[\\_*[\]()~`>#+\-=|{}.!]/g, '\\$&')
      const points = parseFloat(guild.average_points).toFixed(1)
      const active = guild.active_members
      const total = guild.total_members
      const percent = guild.participation_percentage
      const label = `${escapedGuild} \\(${active}/${total} \\- ${percent}%\\)`
      message += prefix + formatList(label, points, guildPadding, pointPadding) + '\n'
    })

    message += `\n_Total guilds: ${guilds.length}_`

    await TwoMessageManager.updateContent(ctx, message)
    
    if (ctx.callbackQuery) {
      await ctx.answerCbQuery()
    }
  } catch (error) {
    console.error('Error in guild rankings scene:', error)
    await TwoMessageManager.updateContent(ctx, ERROR_MESSAGE)
    await ctx.scene.enter('stats_menu')
  }
})

guildRankingsScene.on('text', async (ctx: any) => {
  const handled = await TwoMessageManager.handleNavigation(ctx, ctx.message.text)
  if (!handled) {
    await TwoMessageManager.deleteUserMessage(ctx)
  }
})