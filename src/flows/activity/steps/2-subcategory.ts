import { Markup } from 'telegraf'
import { getSubcategories, isValidSubcategory } from '../helpers/activity-data'

/**
 * Display subcategory selection screen with inline keyboard
 */
export async function showSubcategorySelection(ctx: any): Promise<void> {
  const mainCategory = ctx.wizard.state.mainCategory

  if (!mainCategory) {
    await ctx.reply('❌ Error: No main category selected.')
    return
  }

  const subcategories = getSubcategories(mainCategory)
  
  // Create inline keyboard buttons (2 per row)
  const buttons = []
  for (let i = 0; i < subcategories.length; i += 2) {
    const row = [
      Markup.button.callback(subcategories[i], `subcategory:${subcategories[i]}`)
    ]
    if (i + 1 < subcategories.length) {
      row.push(Markup.button.callback(subcategories[i + 1], `subcategory:${subcategories[i + 1]}`))
    }
    buttons.push(row)
  }
  
  // Add cancel button
  buttons.push([Markup.button.callback('❌ Cancel', 'subcategory:cancel')])

  // Edit the existing message instead of sending a new one
  await ctx.editMessageText(
    `🏃 *Log Activity - Step 2/7*\n\n*Category:* ${mainCategory}\n\nChoose a subcategory:`,
    {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard(buttons)
    }
  )
}

/**
 * Handle subcategory selection from inline button callback
 * @returns true if subcategory was selected successfully, false otherwise
 */
export async function handleSubcategorySelection(ctx: any): Promise<boolean> {
  // Only process callback queries
  if (!ctx.callbackQuery?.data) {
    return false
  }

  const data = ctx.callbackQuery.data

  // Handle cancel
  if (data === 'subcategory:cancel') {
    return false // Let wizard handle the cancel
  }

  // Extract subcategory from callback data
  if (!data.startsWith('subcategory:')) {
    await ctx.answerCbQuery()
    return false
  }

  const selectedSubcategory = data.replace('subcategory:', '')
  const mainCategory = ctx.wizard.state.mainCategory

  // Validate we have a main category
  if (!mainCategory) {
    await ctx.answerCbQuery('❌ No main category found')
    return false
  }

  // Validate subcategory
  if (!isValidSubcategory(mainCategory, selectedSubcategory)) {
    await ctx.answerCbQuery('❌ Invalid subcategory')
    return false
  }

  // Store in wizard state
  ctx.wizard.state.subcategory = selectedSubcategory
  await ctx.answerCbQuery()
  return true
}