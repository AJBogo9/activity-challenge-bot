import { Markup } from 'telegraf'
import { createKeyboard } from '../helpers/keyboard-builder'
import { getSubcategories, getMainCategories, isValidSubcategory } from '../helpers/activity-data'
import { handleCancel, isCancel, isBack } from '../helpers/navigation'

export async function showSubcategorySelection(ctx: any) {
  const mainCategory = ctx.wizard.state.mainCategory
  const subcategories = getSubcategories(mainCategory)
  const keyboard = createKeyboard(subcategories, true)
  
  await ctx.replyWithMarkdown(
    `🏃 *Log Activity - Step 2/6*\n\n*Category:* ${mainCategory}\n\nChoose a subcategory:`,
    Markup.keyboard(keyboard).resize().oneTime()
  )
}

export async function handleSubcategorySelection(ctx: any) {
  const input = ctx.message?.text
  
  if (isCancel(input)) {
    return handleCancel(ctx)
  }
  
  if (isBack(input)) {
    delete ctx.wizard.state.mainCategory
    ctx.wizard.selectStep(0)
    const mainCategories = getMainCategories()
    const keyboard = createKeyboard(mainCategories)
    
    await ctx.replyWithMarkdown(
      '🏃 *Log Activity - Step 1/6*\n\nChoose a main category:',
      Markup.keyboard(keyboard).resize().oneTime()
    )
    return 'back'
  }
  
  const mainCat = ctx.wizard.state.mainCategory
  const selectedSubcategory = input
  
  if (!isValidSubcategory(mainCat, selectedSubcategory)) {
    await ctx.reply('Invalid subcategory. Please choose from the options.')
    return
  }
  
  ctx.wizard.state.subcategory = selectedSubcategory
}