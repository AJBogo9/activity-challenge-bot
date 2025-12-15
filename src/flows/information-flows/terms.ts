import { Scenes } from 'telegraf'
import texts from '../../utils/texts'
import { escapeMarkdown } from '../../utils/format-list'

export const termsScene = new Scenes.BaseScene<any>('terms_scene')
termsScene.enter(async (ctx: any) => {
    const formattedTerms = escapeMarkdown(texts.terms.only_terms)

    await ctx.replyWithMarkdownV2(`*Terms and Conditions*\n\n${formattedTerms}`)
    await ctx.scene.leave()
})
