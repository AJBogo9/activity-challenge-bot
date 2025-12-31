import { Scenes } from 'telegraf'
import { formatList } from '../../utils/format-list'
import { ERROR_MESSAGE } from '../../utils/texts'
import { getTopUsers } from '../../db'
import { TwoMessageManager } from '../../utils/two-message-manager'

function getRankPrefix(index: number): string {
  const medals = ['🥇', '🥈', '🥉']
  if (index < 3) return medals[index]
  return `${index + 1}`
}

export const topUsersScene = new Scenes.BaseScene<any>('top_users')

topUsersScene.enter(async (ctx: any) => {
  try {
    const users = await getTopUsers(15)
    
    if (!users || users.length === 0) {
      await TwoMessageManager.updateContent(ctx, "No users found.")
      await ctx.scene.enter('stats_menu')
      return
    }

    let message = "*Top 15 Participants \\(total points\\)* ⭐\n\n"
    const titlePadding = 21
    const valuePadding = 6

    users.forEach((user, index) => {
      const prefix = getRankPrefix(index)
      const displayName = user.first_name || user.username || 'Unknown'
      message += prefix + formatList(displayName, user.points, titlePadding, valuePadding) + '\n'
    })

    await TwoMessageManager.updateContent(ctx, message)
    
    if (ctx.callbackQuery) {
      await ctx.answerCbQuery()
    }
  } catch (error) {
    console.error('Error fetching top users:', error)
    await TwoMessageManager.updateContent(ctx, ERROR_MESSAGE)
    await ctx.scene.enter('stats_menu')
  }
})

topUsersScene.on('text', async (ctx: any) => {
  const handled = await TwoMessageManager.handleNavigation(ctx, ctx.message.text)
  if (!handled) {
    await TwoMessageManager.deleteUserMessage(ctx)
  }
})