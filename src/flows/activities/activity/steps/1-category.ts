import { Markup } from 'telegraf'
import { createKeyboard } from '../helpers/keyboard-builder'
import { getMainCategories, isValidCategory } from '../helpers/activity-data'

/**
 * Display category selection screen
 */
export async function showCategorySelection(ctx: any): Promise<void> {
  const mainCategories = getMainCategories()
  const keyboard = createKeyboard(mainCategories, true) // Pass true to add cancel button
  
  await ctx.replyWithMarkdown(
    '🏃 *Log Activity - Step 1/6*\n\nChoose a main category:',
    Markup.keyboard(keyboard).resize().oneTime()
  )
}

/**
 * Handle category selection from user input
 * @returns true if category was selected successfully, false otherwise
 */
export async function handleCategorySelection(ctx: any): Promise<boolean> {
  // Only process text messages
  if (!ctx.message?.text) {
    return false
  }

  const selectedCategory = ctx.message.text.trim()

  // Handle cancel
  if (selectedCategory === '❌ Cancel') {
    return false // Let wizard handle the cancel
  }

  // Validate category
  if (!isValidCategory(selectedCategory)) {
    await ctx.reply('❌ Invalid category. Please choose from the options provided.')
    return false
  }

  // Store in wizard state
  ctx.wizard.state.mainCategory = selectedCategory
  return true
}