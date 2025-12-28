import { Scenes, Markup } from 'telegraf'
import { escapeMarkdown } from '../../utils/format-list'
import { POINTS_INFO_MESSAGE } from '../../utils/texts'

export const howToGetPoints = new Scenes.BaseScene<any>('how_to_get_points_scene')

howToGetPoints.enter(async (ctx: any) => {
  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback('⬅️ Back to Info Menu', 'points:back')]
  ])

  if (ctx.callbackQuery) {
    await ctx.editMessageText(escapeMarkdown(POINTS_INFO_MESSAGE), {
      parse_mode: 'MarkdownV2',
      ...keyboard
    })
    await ctx.answerCbQuery()
  } else {
    await ctx.replyWithMarkdownV2(escapeMarkdown(POINTS_INFO_MESSAGE), keyboard)
  }
})

howToGetPoints.action('points:back', async (ctx: any) => {
  await ctx.answerCbQuery()
  await ctx.scene.enter('info_menu')
})