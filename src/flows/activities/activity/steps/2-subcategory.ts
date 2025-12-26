import { Markup } from 'telegraf'
import { createKeyboard } from '../helpers/keyboard-builder'
import { getSubcategories, isValidSubcategory } from '../helpers/activity-data'

/**
 * Display subcategory selection screen
 */
export async function showSubcategorySelection(ctx: any): Promise<void> {
  const mainCategory = ctx.wizard.state.mainCategory
  
  if (!mainCategory) {
    await ctx.reply('❌ Error: No main category selected.')
    return
  }

  const subcategories = getSubcategories(mainCategory)
  const keyboard = createKeyboard(subcategories, true)
  
  await ctx.replyWithMarkdown(
    `🏃 *Log Activity - Step 2/6*\n\n*Category:* ${mainCategory}\n\nChoose a subcategory:`,
    Markup.keyboard(keyboard).resize().oneTime()
  )
}

/**
 * Handle subcategory selection from user input
 * @returns true if subcategory was selected successfully, false otherwise
 */
export async function handleSubcategorySelection(ctx: any): Promise<boolean> {
  // Only process text messages
  if (!ctx.message?.text) {
    return false
  }

  const selectedSubcategory = ctx.message.text.trim()
  const mainCategory = ctx.wizard.state.mainCategory

  // Validate we have a main category
  if (!mainCategory) {
    await ctx.reply('❌ Error: No main category found. Please start over.')
    return false
  }

  // Validate subcategory
  if (!isValidSubcategory(mainCategory, selectedSubcategory)) {
    await ctx.reply('❌ Invalid subcategory. Please choose from the options provided.')
    return false
  }

  // Store in wizard state
  ctx.wizard.state.subcategory = selectedSubcategory
  
  return true
}