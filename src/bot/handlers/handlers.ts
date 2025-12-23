import onlyPrivate from "../../utils/check-private"
import { texts } from "../../utils/texts"
import { bot } from "../instance"
import { handleInlineQuery } from './inlineQueryHandler'
import { handleCalendarSelection } from '../../utils/calendar'

export function registerGlobalHandlers() {
  // Register inline query handler
  bot.on('inline_query', handleInlineQuery)
  
  // NEW: Handle calendar callback queries
  bot.on('callback_query', async (ctx: any) => {
    try {
      // Check if this is a calendar selection
      const selectedDate = handleCalendarSelection(ctx)
      
      if (selectedDate) {
        console.log(`Date selected: ${selectedDate}`)
        
        // Save to scene session if in a scene
        if (ctx.scene && ctx.scene.session) {
          ctx.scene.session.selectedDate = selectedDate
          
          // Answer the callback query
          await ctx.answerCbQuery(`Selected: ${selectedDate}`)
          
          // If in a wizard, proceed to next step and execute it
          if (ctx.wizard) {
            await ctx.wizard.next()
            // Manually trigger the current step's handler
            const handler = ctx.wizard.steps[ctx.wizard.cursor]
            if (handler) {
              await handler(ctx)
            }
          }
        } else {
          // Not in a scene, just acknowledge
          await ctx.answerCbQuery(`You selected: ${selectedDate}`)
        }
        
        return
      }
      
      // If not a calendar callback, you can add other callback handlers here
      // For example, existing inline keyboard button handlers
      
    } catch (error) {
      console.error('Error in callback_query handler:', error)
      await ctx.answerCbQuery('An error occurred').catch(() => {})
    }
  })
  
  // Global handler for "Back to Menu" button - use router
  bot.hears('« Back to Menu', onlyPrivate, (ctx: any) => ctx.scene.enter('menu_router'))
  
  // Global handler for back to main menu - use router
  bot.hears('⬅️ Back to Main Menu', onlyPrivate, (ctx: any) => ctx.scene.enter('menu_router'))
  
  // Global handler for "❌ Cancel" button
  bot.hears('❌ Cancel', onlyPrivate, async (ctx: any) => {
    await ctx.reply('Action cancelled.')
    await ctx.scene.enter('menu_router')
  })
  
  // Global error handler
  bot.catch((err: any, ctx: any) => {
    console.error(`Encountered an error for ${ctx.updateType}`, err)
    try {
      ctx.reply(texts.actions.error.error)
    } catch (e) {
      console.error("Could not reply to error", e)
    }
  })
}