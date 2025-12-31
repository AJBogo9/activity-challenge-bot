import { Scenes } from 'telegraf'
import { TwoMessageManager } from '../../utils/two-message-manager'
import { CONTRIBUTORS } from '../../config/contributors'

export const creditsScene = new Scenes.BaseScene<any>('credits')

creditsScene.enter(async (ctx: any) => {
  // Format contributors message
  const contributorsList = CONTRIBUTORS
    .map(c => `• ${c.name} - ${c.role}`)
    .join('\n')
  
  const message = `👥 *Credits*\n\n` +
    `This bot was made possible by:\n\n` +
    `${contributorsList}\n\n`
  
  await TwoMessageManager.updateContent(ctx, message)
  await ctx.answerCbQuery().catch(() => {}) // Answer callback if it exists
})