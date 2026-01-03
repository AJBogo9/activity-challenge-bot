import { Markup } from 'telegraf'
import { TwoMessageManager } from '../../../utils'
import { getActivities, isValidActivity } from '../helpers/activity-data'

/**
 * Display activity selection screen with inline keyboard
 */
export async function showActivitySelection(ctx: any): Promise<void> {
  const mainCategory = ctx.wizard.state.mainCategory
  const subcategory = ctx.wizard.state.subcategory
  
  if (!mainCategory || !subcategory) {
    await TwoMessageManager.updateContent(
      ctx, 
      '❌ Error: Missing category information. Please start over.'
    )
    return
  }

  const activities = getActivities(mainCategory, subcategory)
  
  // Create inline keyboard buttons (2 per row)
  const buttons = []
  for (let i = 0; i < activities.length; i += 2) {
    const row = [
      Markup.button.callback(activities[i], `activity:${activities[i]}`)
    ]
    if (i + 1 < activities.length) {
      row.push(Markup.button.callback(activities[i + 1], `activity:${activities[i + 1]}`))
    }
    buttons.push(row)
  }
  
  // Add cancel button
  buttons.push([Markup.button.callback('❌ Cancel', 'activity:cancel')])

  const message = `🏃 *Log Activity - Step 3/7*\n\n*Subcategory:* ${subcategory}\n\nChoose specific activity:`
  const keyboard = Markup.inlineKeyboard(buttons)

  await TwoMessageManager.updateContent(ctx, message, keyboard)
}

/**
 * Handle activity selection from inline button callback
 * @returns true if activity was selected successfully, false otherwise
 */
export async function handleActivitySelection(ctx: any): Promise<boolean> {
  // Only process callback queries
  if (!ctx.callbackQuery?.data) {
    return false
  }

  const data = ctx.callbackQuery.data

  // Handle cancel
  if (data === 'activity:cancel') {
    return false // Let wizard handle the cancel
  }

  // Extract activity from callback data
  if (!data.startsWith('activity:')) {
    await ctx.answerCbQuery()
    return false
  }

  const selectedActivity = data.replace('activity:', '')
  const mainCategory = ctx.wizard.state.mainCategory
  const subcategory = ctx.wizard.state.subcategory

  // Validate we have required state
  if (!mainCategory || !subcategory) {
    await ctx.answerCbQuery('❌ Missing category information')
    return false
  }

  // Validate activity
  if (!isValidActivity(mainCategory, subcategory, selectedActivity)) {
    await ctx.answerCbQuery('❌ Invalid activity')
    return false
  }

  // Store in wizard state
  ctx.wizard.state.activity = selectedActivity
  await ctx.answerCbQuery()
  return true
}