import { Scenes, Markup } from 'telegraf'
import { PersistentMenu } from '../../utils/persistent-menu'
import { CONTRIBUTORS } from '../../../data/contributors'

export const creditsScene = new Scenes.BaseScene<any>('credits')
PersistentMenu.registerReplyKeyboardHandlers(creditsScene, 'credits')

creditsScene.enter(async (ctx: any) => {
  // Format contributors message
  const contributorsList = CONTRIBUTORS
    .map(c => `• ${c.name} - ${c.role}`)
    .join('\n')

  const message = `👥 *Credits*\n\n` +
    `This bot was made possible by:\n\n` +
    `${contributorsList}\n\n`

  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback('⬅️ Back to Info Menu', 'credits:back')]
  ])

  if (ctx.callbackQuery) {
    await ctx.editMessageText(message, {
      parse_mode: 'Markdown',
      ...keyboard
    })
    await ctx.answerCbQuery()
  } else {
    await ctx.replyWithMarkdown(message, keyboard)
  }
})

creditsScene.action('credits:back', async (ctx: any) => {
  await ctx.answerCbQuery()
  await ctx.scene.enter('info_menu')
})