import { Markup } from 'telegraf'

export async function handleCancel(ctx: any) {
  await ctx.reply('Activity logging cancelled.', Markup.removeKeyboard())
  return ctx.scene.enter('registered_menu')
}

export function isCancel(input: string | undefined): boolean {
  return input === '❌ Cancel'
}

export function isBack(input: string | undefined): boolean {
  return input === '⬅️ Back'
}