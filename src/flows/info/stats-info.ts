import { Scenes } from 'telegraf'
import { escapeMarkdown } from '../../utils/format-list'
import { STATS_INFO_MESSAGE } from '../../utils/texts'

export const statsInfoScene = new Scenes.BaseScene<any>('stats_info_scene')

statsInfoScene.enter(async (ctx: any) => {
  await ctx.replyWithMarkdownV2(escapeMarkdown(STATS_INFO_MESSAGE))
  await ctx.scene.leave()

  await ctx.scene.enter('info_menu')
})