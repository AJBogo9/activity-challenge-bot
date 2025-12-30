import { Scenes } from 'telegraf'
import { ABOUT_BOT_MESSAGE } from '../../utils/texts'
import { TwoMessageManager } from '../../utils/two-message-manager'

export const aboutBotScene = new Scenes.BaseScene<any>('about_bot_scene')

aboutBotScene.enter(async (ctx: any) => {
  await TwoMessageManager.updateContent(ctx, ABOUT_BOT_MESSAGE)
  await ctx.answerCbQuery().catch(() => {}) // Answer callback if it exists
})