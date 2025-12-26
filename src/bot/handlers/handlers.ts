import { ERROR_MESSAGE } from "../../utils/texts"
import { bot } from "../instance"
import { handleInlineQuery } from './inlineQueryHandler'

export function registerGlobalHandlers() {
  // Register inline query handler
  bot.on('inline_query', handleInlineQuery)
  
  // Calendar callbacks are now handled inside the wizard itself
  
  // Global handler for "Back to Menu" button - use router
  bot.hears('« Back to Menu', (ctx: any) => ctx.scene.enter('menu_router'))
  
  // Global handler for back to main menu - use router
  bot.hears('⬅️ Back to Main Menu', (ctx: any) => ctx.scene.enter('menu_router'))
  
  // Global handler for "❌ Cancel" button
  bot.hears('❌ Cancel', async (ctx: any) => {
    await ctx.reply('Action cancelled.')
    await ctx.scene.enter('menu_router')
  })
  
  // Global error handler
  bot.catch((err: any, ctx: any) => {
    console.error(`Encountered an error for ${ctx.updateType}`, err)
    try {
      ctx.reply(ERROR_MESSAGE)
    } catch (e) {
      console.error("Could not reply to error", e)
    }
  })
}