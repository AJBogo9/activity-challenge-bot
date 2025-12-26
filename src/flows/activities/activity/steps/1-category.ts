import { Markup } from 'telegraf'
import { createKeyboard } from '../helpers/keyboard-builder'
import { getMainCategories, isValidCategory } from '../helpers/activity-data'
import { handleCancel, isCancel } from '../helpers/navigation'

export async function showCategorySelection(ctx: any) {
  const mainCategories = getMainCategories()
  const keyboard = createKeyboard(mainCategories)
  
  await ctx.replyWithMarkdown(
    '🏃 *Log Activity - Step 1/6*\n\nChoose a main category:',
    Markup.keyboard(keyboard).resize().oneTime()
  )
}

export async function handleCategorySelection(ctx: any) {
  const input = ctx.message?.text
  
  if (isCancel(input)) {
    return handleCancel(ctx)
  }
  
  const selectedCategory = input
  
  if (!isValidCategory(selectedCategory)) {
    await ctx.reply('Invalid category. Please choose from the options.')
    return
  }
  
  ctx.wizard.state.mainCategory = selectedCategory
}