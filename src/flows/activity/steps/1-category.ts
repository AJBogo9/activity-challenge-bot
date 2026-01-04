import { Markup } from 'telegraf'
import { TwoMessageManager } from '../../../utils'
import { getMainCategories, isValidCategory } from '../helpers/activity-data'

export async function showCategorySelection(ctx: any): Promise<void> {
  const mainCategories = getMainCategories()
  
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
  
  buttons.push([Markup.button.callback('❌ Cancel', 'category:cancel')])
  
  const message = '🏃 *Log Activity \\- Step 1/7*\n\nChoose a main category:'
  const keyboard = Markup.inlineKeyboard(buttons)
  
  await TwoMessageManager.updateContent(ctx, message, keyboard)
}

export async function handleCategorySelection(ctx: any): Promise<boolean> {
  if (!ctx.callbackQuery?.data) {
    return false
  }

  const data = ctx.callbackQuery.data

  if (data === 'category:cancel') {
    return false
  }

  if (!data.startsWith('category:')) {
    await ctx.answerCbQuery()
    return false
  }

  const selectedCategory = data.replace('category:', '')

  if (!isValidCategory(selectedCategory)) {
    await ctx.answerCbQuery('❌ Invalid category')
    return false
  }

  ctx.wizard.state.mainCategory = selectedCategory
  await ctx.answerCbQuery()
  return true
}