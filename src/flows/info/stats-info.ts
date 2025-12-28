import { Scenes, Markup } from 'telegraf'
import { escapeMarkdown } from '../../utils/format-list'
import { STATS_INFO_MESSAGE } from '../../utils/texts'

export const statsInfoScene = new Scenes.BaseScene<any>('stats_info_scene')

statsInfoScene.enter(async (ctx: any) => {
  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback('⬅️ Back to Info Menu', 'statsinfo:back')]
  ])

  if (ctx.callbackQuery) {
    await ctx.editMessageText(escapeMarkdown(STATS_INFO_MESSAGE), {
      parse_mode: 'MarkdownV2',
      ...keyboard
    })
    await ctx.answerCbQuery()
  } else {
    await ctx.replyWithMarkdownV2(escapeMarkdown(STATS_INFO_MESSAGE), keyboard)
  }
})

statsInfoScene.action('statsinfo:back', async (ctx: any) => {
  await ctx.answerCbQuery()
  await ctx.scene.enter('info_menu')
})