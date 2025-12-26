import { Scenes } from 'telegraf'
import { getTopUsers } from '../../db/point-queries'
import { formatList } from '../../utils/format-list'
import { ERROR_MESSAGE } from '../../utils/texts'

function getRankPrefix(index: number): string {
  const medals = ['🥇', '🥈', '🥉']
  if (index < 3) return medals[index]
  return `${index + 1}`
}

// topusers command
export const topUsersScene = new Scenes.BaseScene<any>('top_users')

topUsersScene.enter(async (ctx: any) => {
  try {
    const users = await getTopUsers(15)
    
    if (!users || users.length === 0) {
      await ctx.reply("No users found.")
      return ctx.scene.enter('stats_menu')
    }

    let message = "*Top 15 Participants \\(total points\\)* ⭐\n\n"
    const titlePadding = 21
    const valuePadding = 6
    
    users.forEach((user, index) => {
      const prefix = getRankPrefix(index)
      const displayName = user.first_name || user.username || 'Unknown'
      message += prefix + formatList(displayName, user.points, titlePadding, valuePadding) + '\n'
    })
    
    await ctx.replyWithMarkdownV2(message)
    
    // Return to stats_menu so the keyboard keeps working
    return ctx.scene.enter('stats_menu')
  } catch (error) {
    console.error('Error fetching top users:', error)
    await ctx.reply(ERROR_MESSAGE)
    return ctx.scene.enter('stats_menu')
  }
})