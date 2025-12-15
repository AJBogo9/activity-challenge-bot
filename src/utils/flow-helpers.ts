import { Markup } from 'telegraf'

export const sendInlineQuestion = async (ctx: any, question: string, buttons: any[]) => {
  return await ctx.reply(question, Markup.inlineKeyboard(buttons))
}

export async function isNotCallback(ctx: any) {
  if (ctx.updateType === 'message') {
    await ctx.reply('Please use the provided buttons to select an activity.')
    return true
  }
  return false
}