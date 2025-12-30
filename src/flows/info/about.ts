import { Scenes, Markup } from 'telegraf'
import { ABOUT_BOT_MESSAGE } from '../../utils/texts'
import { TwoMessageManager } from '../../utils/two-message-manager'

export const aboutBotScene = new Scenes.BaseScene<any>('about_bot_scene')

aboutBotScene.enter(async (ctx: any) => {
  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback('⬅️ Back to Info Menu', 'about:back')]
  ])

  await TwoMessageManager.updateContent(ctx, ABOUT_BOT_MESSAGE, keyboard)
  await ctx.answerCbQuery().catch(() => {}) // Answer callback if it exists
})

// Handle back button - return to info menu
aboutBotScene.action('about:back', async (ctx: any) => {
  await ctx.answerCbQuery()
  await ctx.scene.enter('info_menu')
})