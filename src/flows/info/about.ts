import { Scenes, Markup } from 'telegraf'
import { ABOUT_BOT_MESSAGE } from '../../utils/texts'
import { PersistentMenu } from '../../utils/persistent-menu'

export const aboutBotScene = new Scenes.BaseScene<any>('about_bot_scene')
PersistentMenu.registerReplyKeyboardHandlers(aboutBotScene, 'about_bot_scene')

aboutBotScene.enter(async (ctx: any) => {
  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback('⬅️ Back to Info Menu', 'about:back')]
  ])

  if (ctx.callbackQuery) {
    await ctx.editMessageText(ABOUT_BOT_MESSAGE, {
      parse_mode: 'MarkdownV2',
      link_preview_options: { is_disabled: true },
      ...keyboard
    })
    await ctx.answerCbQuery()
  } else {
    await ctx.replyWithMarkdownV2(ABOUT_BOT_MESSAGE, {
      link_preview_options: { is_disabled: true },
      ...keyboard
    })
  }
})

// Handle back button - return to info menu
aboutBotScene.action('about:back', async (ctx: any) => {
  await ctx.answerCbQuery()
  await ctx.scene.enter('info_menu')
})