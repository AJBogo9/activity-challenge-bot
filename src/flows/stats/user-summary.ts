import { Scenes } from 'telegraf'
import { getUserSummary, getNearbyUsers, getNearbyGuildUsers } from '../../db/point-queries'
import { findUserByTelegramId } from '../../db/users'
import { ERROR_MESSAGE } from '../../utils/texts'
import { escapeMarkdown, getRankPrefix } from '../../utils/format-list'

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
      return
    }

    let message = '*Your Points Summary* 📊\n\n'
    message += `*Name:* ${escapeMarkdown(summary.first_name || summary.username || 'Unknown')}\n`
    message += `*Guild:* ${escapeMarkdown(summary.guild || 'N/A')}\n`
    message += `\n*Total Points:* ${escapeMarkdown(summary.points.toString())} pts\n`

    if (summary.global_rank) {
      message += `*Global Rank:* ${getRankPrefix(parseInt(summary.global_rank))} / ${summary.total_users}\n`
    }

    if (summary.guild_rank) {
      message += `*Guild Rank:* ${getRankPrefix(parseInt(summary.guild_rank))} / ${summary.guild_users}\n`
    }

    // Nearby users
    message += '\n*Nearby Global Players:* 🌎\n'
    const nearbyGlobal = await getNearbyUsers(userId)
    for (const u of nearbyGlobal) {
      const isMe = u.telegram_id === userId
      const name = escapeMarkdown(u.first_name || u.username || 'Unknown')
      const rankIcon = getRankPrefix(parseInt(u.rank))
      message += `${isMe ? '👉 ' : ''}${rankIcon} ${name}: \`${escapeMarkdown(u.points.toString())}\` pts\n`
    }

    if (summary.guild) {
      message += `\n*Nearby in ${escapeMarkdown(summary.guild)}:* 🏰\n`
      const nearbyGuild = await getNearbyGuildUsers(userId, summary.guild)
      for (const u of nearbyGuild) {
        const isMe = u.telegram_id === userId
        const name = escapeMarkdown(u.first_name || u.username || 'Unknown')
        const rankIcon = getRankPrefix(parseInt(u.rank))
        message += `${isMe ? '👉 ' : ''}${rankIcon} ${name}: \`${escapeMarkdown(u.points.toString())}\` pts\n`
      }
    }

    await ctx.replyWithMarkdownV2(message)
    await ctx.scene.enter('stats_menu')
  } catch (error) {
    console.error('Error fetching user summary:', error)
    await ctx.reply(ERROR_MESSAGE)
    await ctx.scene.enter('stats_menu')
  }
})