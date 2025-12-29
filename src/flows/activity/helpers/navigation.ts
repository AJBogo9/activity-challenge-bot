import { Markup } from 'telegraf'

/**
 * Cancel the wizard and return to main menu
 */
export async function handleCancel(ctx: any): Promise<void> {
  await ctx.reply(
    '❌ Activity logging cancelled.',
    Markup.removeKeyboard()
  )
  await ctx.scene.enter('registered_menu')
}