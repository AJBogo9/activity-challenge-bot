import { Scenes } from 'telegraf'
import { TERMS_AND_CONDITIONS, TwoMessageManager } from '../../utils'

export const termsScene = new Scenes.BaseScene<any>('terms_scene')

termsScene.enter(async (ctx: any) => {
  await TwoMessageManager.updateContent(ctx, TERMS_AND_CONDITIONS)
  await ctx.answerCbQuery().catch(() => {}) // Answer callback if it exists
})