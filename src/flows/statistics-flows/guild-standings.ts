import { Scenes } from 'telegraf'
import * as pointService from '../../services/point-service'
import texts from '../../utils/texts'
import { formatList } from '../../utils/format-list'
import { emojis } from '../../config/constants'

// topguilds command
export const guildStandingsScene = new Scenes.BaseScene<any>('guild_standings_scene')
guildStandingsScene.enter(async (ctx: any) => {
  try {
    const averages = await pointService.getGuildsLeaderboards()
    if (!averages || averages.length === 0) {
      await ctx.reply("No guild statistics available.")
      return ctx.scene.leave()
    }
    averages.sort((a: any, b: any) => b.average - a.average)

    let message = '*Standings \\(by average points\\)* 🏆\n\n'

    const guildPadding = 15
    const pointPadding = 6

    averages.forEach((guild: any, index: number) => {
      const emoji = index < emojis.length ? emojis[index] : `${index + 1}`
      message += emoji + formatList(guild.guild, guild.average, guildPadding, pointPadding) + '\n'
    })

    await ctx.replyWithMarkdownV2(message)
    ctx.scene.leave()
  } catch (error) {
    await ctx.reply(texts.actions.error.error)
    console.error(error)
    ctx.scene.leave()
  }
})

// topguilds50 command
export const guildTopStandingsScene = new Scenes.BaseScene<any>('guild_top_standings_scene')
guildTopStandingsScene.enter(async (ctx: any) => {
  try {
    const averages = await pointService.getGuildsTopLeaderboards()
    if (!averages || averages.length === 0) {
      await ctx.reply("No guild statistics available.")
      return ctx.scene.leave()
    }
    averages.sort((a: any, b: any) => b.average - a.average)

    let message = '*Standings \\(by avg of top 50%\\)* 🏆\n\n'

    const guildPadding = 15
    const pointPadding = 6

    averages.forEach((guild: any, index: number) => {
      const emoji = index < emojis.length ? emojis[index] : `${index + 1}`
      message += emoji + formatList(guild.guild, guild.average.toString(), guildPadding, pointPadding) + '\n'
    })

    await ctx.replyWithMarkdownV2(message)
    ctx.scene.leave()
  } catch (error) {
    await ctx.reply(texts.actions.error.error)
    console.error(error)
    ctx.scene.leave()
  }
})

