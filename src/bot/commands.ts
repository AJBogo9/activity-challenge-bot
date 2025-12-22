import { bot } from './instance'
import commandScenes from '../config/commands'
import onlyPrivate from '../utils/check-private'
import { getActivityById } from './handlers/inlineQueryHandler'

export function registerCommands() {
  // Start command - show welcome wizard which then goes to menu
  bot.start(onlyPrivate, (ctx: any) => ctx.scene.enter('start_wizard'))
  
  // Quick log command - for inline query results
  bot.command('quicklog', onlyPrivate, async (ctx: any) => {
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
  
  // Register all commands from config
  commandScenes.forEach(({ command, scene, private: isPrivate }: any) => {
    if (isPrivate) {
      bot.command(command, onlyPrivate, (ctx: any) => ctx.scene.enter(scene))
    } else {
      bot.command(command, (ctx: any) => ctx.scene.enter(scene))
    }
  })
}