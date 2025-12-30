import { Scenes, Markup } from 'telegraf'
import { TwoMessageManager } from '../../utils/two-message-manager'
import { CONTRIBUTORS } from '../../../data/contributors'

export const creditsScene = new Scenes.BaseScene<any>('credits')

creditsScene.enter(async (ctx: any) => {
  // Format contributors message
  const contributorsList = CONTRIBUTORS
    .map(c => `• ${c.name} - ${c.role}`)
    .join('\n')

  const message = `👥 *Credits*\n\n` +
    `This bot was made possible by:\n\n` +
    `${contributorsList}\n\n` +
    `Thank you for your contributions! 🙏`

  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback('⬅️ Back to Info Menu', 'credits:back')]
  ])

  await TwoMessageManager.updateContent(ctx, message, keyboard)
  await ctx.answerCbQuery().catch(() => {}) // Answer callback if it exists
})

creditsScene.action('credits:back', async (ctx: any) => {
  await ctx.answerCbQuery()
  await ctx.scene.enter('info_menu')
})