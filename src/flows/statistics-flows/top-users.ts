import { Scenes } from 'telegraf'
import User from '../../models/user-model'
import { formatList } from '../../utils/format-list'
import texts from '../../utils/texts'
import { emojis } from '../../config/constants'

// topusers command
export const topUsersScene = new Scenes.BaseScene<any>('top_users_scene')
topUsersScene.enter(async (ctx: any) => {
  try {
    const users = await User.find({}).sort({ "points.total": -1 }).limit(15)
    if (!users || users.length === 0) {
      await ctx.reply("No users found.")
      return ctx.scene.leave()
    }

    let message = "*Top 15 Participants \\(total points\\)* ⭐\n\n"

    const titlePadding = 21
    const valuePadding = 6

    users.forEach((user: any, index: number) => {
      const emoji = index < emojis.length ? emojis[index] : `${index + 1}`
      message += emoji + formatList(user.name, (user.points as any).total, titlePadding, valuePadding) + '\n'
    })

    await ctx.replyWithMarkdownV2(message)
    ctx.scene.leave()
  } catch (error) {
    console.error(error)
    await ctx.reply(texts.actions.error.error)
    ctx.scene.leave()
  }
})