import { Scenes, Markup } from 'telegraf'
import * as pointService from '../../db/point-queries'
import { escapeMarkdown } from '../../utils/format-list'
import { ERROR_MESSAGE } from '../../utils/texts'

function getRankPrefix(index: number): string {
  const medals = ['🥇', '🥈', '🥉']
  if (index < 3) return medals[index]
  return `${index + 1}\\.`
}

export const guildComparisonScene = new Scenes.BaseScene<any>('guild_comparison')

guildComparisonScene.enter(async (ctx: any) => {
  try {
    const guilds = await pointService.getGuildLeaderboard()
    
    let message = '*📊 Guild Comparison*\n\n'
    
    guilds.forEach((guild: any, index: number) => {
      const prefix = getRankPrefix(index)
      const escapedGuild = escapeMarkdown(guild.guild)
      const avgPoints = parseFloat(guild.average_points)
      const totalPoints = parseFloat(guild.total_points)
      const active = parseInt(guild.active_members)
      const total = parseInt(guild.total_members)
      const participation = parseFloat(guild.participation_percentage)
      
      message += `${prefix} *${escapedGuild}*\n`
      message += `   Average: ${escapeMarkdown(avgPoints.toFixed(1))} pts\n`
      message += `   Total Points: ${escapeMarkdown(totalPoints.toFixed(0))} pts\n`
      message += `   Active Members: ${escapeMarkdown(active.toString())}\n`
      message += `   Total Members: ${escapeMarkdown(total.toString())}\n`
      message += `   Participation: ${escapeMarkdown(participation.toFixed(1))}\\%\n\n`
    })
    
    message += `_Total guilds: ${guilds.length}_`
    
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('⬅️ Back to Stats Menu', 'guildcomparison:back')]
    ])
    
    if (ctx.callbackQuery) {
      await ctx.editMessageText(message, {
        parse_mode: 'MarkdownV2',
        ...keyboard
      })
      await ctx.answerCbQuery()
    } else {
      await ctx.replyWithMarkdownV2(message, keyboard)
    }
    
  } catch (error) {
    await ctx.reply(ERROR_MESSAGE)
    console.error('Error in guild comparison scene:', error)
    return ctx.scene.enter('stats_menu')
  }
})

guildComparisonScene.action('guildcomparison:back', async (ctx: any) => {
  await ctx.answerCbQuery()
  await ctx.scene.enter('stats_menu')
})