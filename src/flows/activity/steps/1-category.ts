import { Markup } from 'telegraf'
import { TwoMessageManager } from '../../../utils'
import { getMainCategories, isValidCategory } from '../helpers/activity-data'


/**
 * Display category selection screen with inline keyboard
 */
export async function showCategorySelection(ctx: any): Promise<void> {
  const mainCategories = getMainCategories()
  
  // Create inline keyboard buttons (2 per row)
  const buttons = []
  for (let i = 0; i < mainCategories.length; i += 2) {
    const row = [
      Markup.button.callback(mainCategories[i], `category:${mainCategories[i]}`)
    ]
    if (i + 1 < mainCategories.length) {
      row.push(Markup.button.callback(mainCategories[i + 1], `category:${mainCategories[i + 1]}`))
    }
    buttons.push(row)
  }
  
  // Add cancel button
  buttons.push([Markup.button.callback('❌ Cancel', 'category:cancel')])

  const message = '🏃 *Log Activity - Step 1/7*\n\nChoose a main category:'
  const keyboard = Markup.inlineKeyboard(buttons)

  // Use TwoMessageManager to update the content message
  await TwoMessageManager.updateContent(ctx, message, keyboard)
}

/**
 * Handle category selection from inline button callback
 * @returns true if category was selected successfully, false otherwise
 */
export async function handleCategorySelection(ctx: any): Promise<boolean> {
  // Only process callback queries
  if (!ctx.callbackQuery?.data) {
    return false
  }

  const data = ctx.callbackQuery.data

  // Handle cancel
  if (data === 'category:cancel') {
    return false // Let wizard handle the cancel
  }

  // Extract category from callback data
  if (!data.startsWith('category:')) {
    await ctx.answerCbQuery()
    return false
  }

  const selectedCategory = data.replace('category:', '')

  // Validate category
  if (!isValidCategory(selectedCategory)) {
    await ctx.answerCbQuery('❌ Invalid category')
    return false
  }

  // Store in wizard state
  ctx.wizard.state.mainCategory = selectedCategory
  await ctx.answerCbQuery()
  return true
}