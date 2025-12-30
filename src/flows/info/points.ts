import { Scenes, Markup } from 'telegraf'
import { POINTS_INFO_MESSAGE } from '../../utils/texts'
import { TwoMessageManager } from '../../utils/two-message-manager'

export const howToGetPoints = new Scenes.BaseScene<any>('how_to_get_points_scene')

howToGetPoints.enter(async (ctx: any) => {
  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback('⬅️ Back to Info Menu', 'points:back')]
  ])

  await TwoMessageManager.updateContent(ctx, POINTS_INFO_MESSAGE, keyboard)
  await ctx.answerCbQuery().catch(() => {}) // Answer callback if it exists
})

howToGetPoints.action('points:back', async (ctx: any) => {
  await ctx.answerCbQuery()
  await ctx.scene.enter('info_menu')
})