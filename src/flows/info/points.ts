import { Scenes } from 'telegraf'
import { POINTS_INFO_MESSAGE, TwoMessageManager } from '../../utils'

export const howToGetPoints = new Scenes.BaseScene<any>('how_to_get_points_scene')

howToGetPoints.enter(async (ctx: any) => {
  await TwoMessageManager.updateContent(ctx, POINTS_INFO_MESSAGE)
  await ctx.answerCbQuery().catch(() => {}) // Answer callback if it exists
})