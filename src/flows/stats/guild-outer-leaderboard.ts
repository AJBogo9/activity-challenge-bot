import { Scenes } from 'telegraf'
import { formatList } from '../../utils/format-list'
import { ERROR_MESSAGE } from '../../utils/texts'
import { getGuildLeaderboard } from '../../db'
import { TwoMessageManager } from '../../utils/two-message-manager'

function getRankPrefix(index: number): string {
  const medals = ['🥇', '🥈', '🥉']
  if (index < 3) return medals[index]
  return `${index + 1}\\.`
}

/**
 * Guild leaderboard scene - shows average points per member
 * Scene ID: 'guild_leaderboard'
 */
export const guildLeaderboardScene = new Scenes.BaseScene<any>('guild_leaderboard')

guildLeaderboardScene.enter(async (ctx: any) => {
  try {
    const guilds = await getGuildLeaderboard()

    let message = '*Guild Leaderboard \\(by average points\\)* 🏆\n\n'
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

    // No keyboard anymore
    if (ctx.callbackQuery) {
      try {
        await ctx.editMessageText(message, {
          parse_mode: 'MarkdownV2'
        })
      } catch (error: any) {
        // Ignore "message is not modified" errors
        if (!error.description?.includes('message is not modified')) {
          throw error
        }
      }
      await ctx.answerCbQuery()
    } else {
      await ctx.replyWithMarkdownV2(message)
    }
  } catch (error) {
    console.error('Error in guild leaderboard scene:', error)
    await ctx.reply(ERROR_MESSAGE)
    await ctx.scene.enter('stats_menu')
  }
})

// Handle reply keyboard navigation
guildLeaderboardScene.on('text', async (ctx: any) => {
  const handled = await TwoMessageManager.handleNavigation(ctx, ctx.message.text)
  
  if (!handled) {
    // If not a navigation button, just delete the message
    await TwoMessageManager.deleteUserMessage(ctx)
  }
})