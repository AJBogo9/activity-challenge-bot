import { Scenes } from 'telegraf'
import * as pointService from '../../services/point-service'
import texts from '../../utils/texts'
import { formatList } from '../../utils/format-list'
import { emojis } from '../../config/constants'

// leaderboards command
export const teamRankingsScene = new Scenes.BaseScene<any>('team_rankings_scene')
teamRankingsScene.enter(async (ctx: any) => {
  try {
    const rankings = await pointService.getTeamRankings()
    if (!rankings || rankings.length === 0) {
      await ctx.reply("There are no teams with three or more members where all members have more than 0 points.")
      return ctx.scene.leave()
    }
    let message = '*Team Rankings \\(by average points\\)* ⚡\n\n'

    const titlePadding = 21
    const valuePadding = 6

    rankings.forEach((team: any, index: number) => {
      const emoji = index < emojis.length ? emojis[index] : `${index + 1}`
      message += emoji + formatList(team.name, team.averagePointsPerMember, titlePadding, valuePadding) + '\n'
    })

    await ctx.replyWithMarkdownV2(message)
    ctx.scene.leave()
  } catch (error) {
    await ctx.reply(texts.actions.error.error)
    console.error(error)
    ctx.scene.leave()
  }
})