import { Scenes, Markup } from 'telegraf'
import { POINTS_INFO_MESSAGE } from '../../utils/texts'
import { PersistentMenu } from '../../utils/persistent-menu'

export const howToGetPoints = new Scenes.BaseScene<any>('how_to_get_points_scene')

// Register reply keyboard handlers so user can navigate away
PersistentMenu.registerReplyKeyboardHandlers(howToGetPoints, 'how_to_get_points_scene')

howToGetPoints.enter(async (ctx: any) => {
  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback('⬅️ Back to Info Menu', 'points:back')]
  ])

  if (ctx.callbackQuery) {
    await ctx.editMessageText(POINTS_INFO_MESSAGE, {
      parse_mode: 'MarkdownV2',
      link_preview_options: { is_disabled: true },
      ...keyboard
    })
    await ctx.answerCbQuery()
  } else {
    await ctx.replyWithMarkdownV2(POINTS_INFO_MESSAGE, {
      link_preview_options: { is_disabled: true },
      ...keyboard
    })
  }
})

howToGetPoints.action('points:back', async (ctx: any) => {
  await ctx.answerCbQuery()
  await ctx.scene.enter('info_menu')
})