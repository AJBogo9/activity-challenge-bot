import { Scenes, Markup } from 'telegraf'
import { TERMS_AND_CONDITIONS } from '../../utils/texts'
import { TwoMessageManager } from '../../utils/two-message-manager'

export const termsScene = new Scenes.BaseScene<any>('terms_scene')

termsScene.enter(async (ctx: any) => {
  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback('⬅️ Back to Info Menu', 'terms:back')]
  ])

  await TwoMessageManager.updateContent(ctx, TERMS_AND_CONDITIONS, keyboard)
  await ctx.answerCbQuery().catch(() => {}) // Answer callback if it exists
})

// Handle back button - return to info menu
termsScene.action('terms:back', async (ctx: any) => {
  await ctx.answerCbQuery()
  await ctx.scene.enter('info_menu')
})