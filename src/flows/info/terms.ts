import { Scenes, Markup } from 'telegraf'
import { TERMS_AND_CONDITIONS } from '../../utils/texts'
import { PersistentMenu } from '../../utils/persistent-menu'

export const termsScene = new Scenes.BaseScene<any>('terms_scene')
PersistentMenu.registerReplyKeyboardHandlers(termsScene, 'terms_scene')

termsScene.enter(async (ctx: any) => {
  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback('⬅️ Back to Info Menu', 'terms:back')]
  ])

  // Edit the existing message (from info menu click)
  if (ctx.callbackQuery) {
    await ctx.editMessageText(TERMS_AND_CONDITIONS, {
      parse_mode: 'MarkdownV2',
      ...keyboard
    })
    await ctx.answerCbQuery()
  } else {
    // Fallback: if somehow called directly, send new message
    await ctx.replyWithMarkdownV2(TERMS_AND_CONDITIONS, keyboard)
  }
})

// Handle back button - return to info menu
termsScene.action('terms:back', async (ctx: any) => {
  await ctx.answerCbQuery()
  await ctx.scene.enter('info_menu')
})