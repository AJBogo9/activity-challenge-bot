import { Scenes } from 'telegraf'
import { getUserSummary } from '../../db/point-queries'
import { findUserByTelegramId } from '../../db/users'
import { texts } from '../../utils/texts'
import { formatList, escapeMarkdown } from '../../utils/format-list'

// summary command
export const userSummaryScene = new Scenes.BaseScene<any>('user_summary')

userSummaryScene.enter(async (ctx: any) => {
  try {
    const userId = ctx.from.id.toString()
    const user = await findUserByTelegramId(userId)
    
    if (!user) {
      await ctx.reply("User not found. Please register first using /register.")
      return ctx.scene.leave()
    }

    const summary = await getUserSummary(userId)
    
    if (!summary) {
      await ctx.reply("Could not retrieve your summary.")
      await ctx.scene.enter('stats_menu')
    }

    const titlePadding = 21
    const valuePadding = 6

    let message = '*Your Points Summary* 📊\n\n'
    message += `*Name:* ${escapeMarkdown(summary.first_name || summary.username || 'Unknown')}\n`
    message += `*Guild:* ${escapeMarkdown(summary.guild || 'N/A')}\n`
    // if (summary.team_name) {
    //   message += `*Team:* ${escapeMarkdown(summary.team_name)}\n`
    // }
    message += `\n*Total Points:* ${escapeMarkdown(summary.points.toString())} pts\n\n`

    await ctx.replyWithMarkdownV2(message)
    await ctx.scene.enter('stats_menu')
  } catch (error) {
    console.error('Error fetching user summary:', error)
    await ctx.reply(texts.actions.error.error)
    await ctx.scene.enter('stats_menu')
  }
})