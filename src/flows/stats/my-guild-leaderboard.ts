import { Scenes } from 'telegraf'
import { escapeMarkdown, formatList } from '../../utils/format-list'
import { ERROR_MESSAGE } from '../../utils/texts'
import { findUserByTelegramId } from '../../db/users'
import { TwoMessageManager } from '../../utils/two-message-manager'
import { getTopGuildMembers } from '../../db'

function getRankPrefix(index: number): string {
  const medals = ['🥇', '🥈', '🥉']
  if (index < 3) return medals[index]
  return `${index + 1}`
}

/**
 * My guild leaderboard scene - shows top members within the user's guild
 * Scene ID: 'my_guild_leaderboard'
 */
export const myGuildLeaderboardScene = new Scenes.BaseScene<any>('my_guild_leaderboard')

myGuildLeaderboardScene.enter(async (ctx: any) => {
  try {
    const userId = ctx.from.id.toString()
    const user = await findUserByTelegramId(userId)
    
    if (!user || !user.guild) {
      await TwoMessageManager.updateContent(
        ctx,
        "You need to be in a guild to view this leaderboard\\."
      )
      await ctx.scene.enter('stats_menu')
      return
    }

    // Get top members from the user's guild
    const guildMembers = await getTopGuildMembers(user.guild, 15)
    
    if (!guildMembers || guildMembers.length === 0) {
      await TwoMessageManager.updateContent(
        ctx,
        `No active members found in ${escapeMarkdown(user.guild)}\\.`
      )
      await ctx.scene.enter('stats_menu')
      return
    }

    let message = `*👥 ${escapeMarkdown(user.guild)} Leaderboard*\n`
    message += `_Top ${guildMembers.length} members_\n\n`
    
    const titlePadding = 21
    const valuePadding = 6

    guildMembers.forEach((member: any, index: number) => {
      const prefix = getRankPrefix(index)
      const displayName = member.first_name || member.username || 'Unknown'
      const isCurrentUser = member.telegram_id === userId
      const marker = isCurrentUser ? '👉 ' : ''
      
      message += marker + prefix + formatList(displayName, member.points, titlePadding, valuePadding) + '\n'
    })

    await TwoMessageManager.updateContent(ctx, message)
    
    if (ctx.callbackQuery) {
      await ctx.answerCbQuery()
    }
  } catch (error) {
    console.error('Error in my guild leaderboard scene:', error)
    await TwoMessageManager.updateContent(ctx, ERROR_MESSAGE)
    await ctx.scene.enter('stats_menu')
  }
})

myGuildLeaderboardScene.on('text', async (ctx: any) => {
  const handled = await TwoMessageManager.handleNavigation(ctx, ctx.message.text)
  if (!handled) {
    await TwoMessageManager.deleteUserMessage(ctx)
  }
})