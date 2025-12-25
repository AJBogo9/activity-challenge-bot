import { bot } from './instance'
import { getActivityById } from './handlers/inlineQueryHandler'

export function registerCommands() {
  // Start command - entry point when user first opens bot
  bot.start((ctx: any) => ctx.scene.enter('start_wizard'))
  
  // Menu command - lets users return to main menu if stuck
  bot.command('menu', (ctx: any) => {
    ctx.scene.leave()
    return ctx.scene.enter('registered_menu')
  })
  
  // Cancel command - universal escape hatch
  bot.command('cancel', (ctx: any) => {
    ctx.scene.leave()
    return ctx.scene.enter('registered_menu')
  })
  
  // Quick log command - for inline query results
  bot.command('quicklog', async (ctx: any) => {
    const activityId = ctx.message.text.split(' ')[1]
    
    if (!activityId) {
      await ctx.reply('Invalid activity selection. Please try again using the inline search.')
      return
    }
    
    const selectedActivity = getActivityById(activityId)
    
    if (!selectedActivity) {
      await ctx.reply('Activity not found. Please try searching again.')
      return
    }
    
    // Enter the quick start wizard with pre-filled state
    await ctx.scene.enter('quick_start_wizard', {
      mainCategory: selectedActivity.mainCategory,
      subcategory: selectedActivity.subcategory,
      activity: selectedActivity.activity,
      skipActivityStep: selectedActivity.skipActivityStep
    })
  })
}