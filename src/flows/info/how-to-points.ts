import { Scenes } from 'telegraf'
import { escapeMarkdown } from '../../utils/format-list'
import { POINTS_INFO_MESSAGE } from '../../utils/texts'

export const howToGetPoints = new Scenes.BaseScene<any>('how_to_get_points_scene')

howToGetPoints.enter(async (ctx: any) => {
  await ctx.replyWithMarkdownV2(escapeMarkdown(POINTS_INFO_MESSAGE))
  // Return to info menu instead of leaving
  await ctx.scene.enter('info_menu')
})
