import { Markup } from 'telegraf'
import { createKeyboard } from '../helpers/keyboard-builder'
import { getActivities, isValidActivity } from '../helpers/activity-data'

/**
 * Display activity selection screen
 */
export async function showActivitySelection(ctx: any): Promise<void> {
  const mainCategory = ctx.wizard.state.mainCategory
  const subcategory = ctx.wizard.state.subcategory

  if (!mainCategory || !subcategory) {
    await ctx.reply('❌ Error: Missing category information. Please start over.')
    return
  }

  const activities = getActivities(mainCategory, subcategory)
  const keyboard = createKeyboard(activities, true)

  await ctx.replyWithMarkdown(
    `🏃 *Log Activity - Step 3/7*\n\n*Subcategory:* ${subcategory}\n\nChoose specific activity:`,
    Markup.keyboard(keyboard).resize().oneTime()
  )
}

/**
 * Handle activity selection from user input
 * @returns true if activity was selected successfully, false otherwise
 */
export async function handleActivitySelection(ctx: any): Promise<boolean> {
  // Only process text messages
  if (!ctx.message?.text) {
    return false
  }

  const selectedActivity = ctx.message.text.trim()

  // Handle cancel
  if (selectedActivity === '❌ Cancel') {
    return false // Let wizard handle the cancel
  }

  const mainCategory = ctx.wizard.state.mainCategory
  const subcategory = ctx.wizard.state.subcategory

  // Validate we have required state
  if (!mainCategory || !subcategory) {
    await ctx.reply('❌ Error: Missing category information. Please start over.')
    return false
  }

  // Validate activity
  if (!isValidActivity(mainCategory, subcategory, selectedActivity)) {
    await ctx.reply('❌ Invalid activity. Please choose from the options provided.')
    return false
  }

  // Store in wizard state
  ctx.wizard.state.activity = selectedActivity
  return true
}