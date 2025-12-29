import { Scenes, Markup } from 'telegraf'
import * as pointService from '../../db/point-queries'
import { formatList } from '../../utils/format-list'
import { ERROR_MESSAGE } from '../../utils/texts'

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
    const guilds = await pointService.getGuildLeaderboard()
    
    let message = '*Guild Leaderboard \\(by average points\\)* 🏆\n\n'
    
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
    
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('⬅️ Back to Stats Menu', 'guildleaderboard:back')]
    ])
    
    if (ctx.callbackQuery) {
      try {
        await ctx.editMessageText(message, {
          parse_mode: 'MarkdownV2',
          ...keyboard
        })
      } catch (error: any) {
        // Ignore "message is not modified" errors
        if (!error.description?.includes('message is not modified')) {
          throw error
        }
      }
      await ctx.answerCbQuery()
    } else {
      await ctx.replyWithMarkdownV2(message, keyboard)
    }
    
  } catch (error) {
    console.error('Error in guild leaderboard scene:', error)
    await ctx.reply(ERROR_MESSAGE)
    return ctx.scene.enter('stats_menu')
  }
})

guildLeaderboardScene.action('guildleaderboard:back', async (ctx: any) => {
  await ctx.answerCbQuery()
  await ctx.scene.enter('stats_menu')
})