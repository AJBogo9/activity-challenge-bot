import { Scenes } from 'telegraf'
import { escapeMarkdown } from '../../utils/format-list'
import { TERMS_MESSAGE } from '../../utils/texts'

export const termsScene = new Scenes.BaseScene<any>('terms_scene')

termsScene.enter(async (ctx: any) => {
  await ctx.replyWithMarkdownV2(escapeMarkdown(TERMS_MESSAGE))
  await ctx.scene.leave()

  await ctx.scene.enter('info_menu')
})