import { Scenes } from 'telegraf'
import * as pointService from '../../services/point-service'
import * as userService from '../../services/user-service'
import texts from '../../utils/texts'
import { formatList, escapeMarkdown } from '../../utils/format-list'

// summary command
export const userSummaryScene = new Scenes.BaseScene<any>('user_summary_scene')
userSummaryScene.enter(async (ctx: any) => {
  try {
    const user = await userService.findUser(ctx.from.id)
    if (!user) {
      await ctx.reply("User not found. Please register first using /register.")
      return ctx.scene.leave()
    }
    const [summary] = await Promise.all([pointService.getUserSummary(ctx.from.id)])

    const titlePadding = 21
    const valuePadding = 6

    let message = '*Your Points Summary* 📊\n\n'
    message += `*Total of* ${escapeMarkdown((summary as any).total)} pts \n\n`

    message += formatList('Exercise', (summary as any).exercise, titlePadding, valuePadding, 'pts') + '\n'
    message += formatList('Sports Session', (summary as any).sportsTurn, titlePadding, valuePadding, 'pts') + '\n'
    message += formatList('Try Sport', (summary as any).trySport, titlePadding, valuePadding, 'pts') + '\n'
    message += formatList('Try Recipe', (summary as any).tryRecipe, titlePadding, valuePadding, 'pts') + '\n'
    message += formatList('Good Sleep', (summary as any).goodSleep, titlePadding, valuePadding, 'pts') + '\n'
    message += formatList('Meditation', (summary as any).meditate, titlePadding, valuePadding, 'pts') + '\n'
    message += formatList('Less Alcohol', (summary as any).lessAlc, titlePadding, valuePadding, 'pts') + '\n'

    await ctx.replyWithMarkdownV2(message)
    ctx.scene.leave()
  } catch (error) {
    await ctx.reply(texts.actions.error.error)
    console.error(error)
    ctx.scene.leave()
  }
})

