import { Markup } from 'telegraf'
import { TwoMessageManager, escapeMarkdownV2 } from '../../../utils'
import { getSubcategories, isValidSubcategory } from '../helpers/activity-data'

export async function showSubcategorySelection(ctx: any): Promise<void> {
  const mainCategory = ctx.wizard.state.mainCategory
  
  if (!mainCategory) {
    await TwoMessageManager.updateContent(ctx, '❌ Error: No main category selected\\.')
    return
  }

  const subcategories = getSubcategories(mainCategory)
  
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
  
  buttons.push([Markup.button.callback('❌ Cancel', 'subcategory:cancel')])
  
  const message = `🏃 *Log Activity \\- Step 2/7*\n\n*Category:* ${escapeMarkdownV2(mainCategory)}\n\nChoose a subcategory:`
  const keyboard = Markup.inlineKeyboard(buttons)
  
  await TwoMessageManager.updateContent(ctx, message, keyboard)
}

export async function handleSubcategorySelection(ctx: any): Promise<boolean> {
  if (!ctx.callbackQuery?.data) {
    return false
  }

  const data = ctx.callbackQuery.data

  if (data === 'subcategory:cancel') {
    return false
  }

  if (!data.startsWith('subcategory:')) {
    await ctx.answerCbQuery()
    return false
  }

  const selectedSubcategory = data.replace('subcategory:', '')
  const mainCategory = ctx.wizard.state.mainCategory

  if (!mainCategory) {
    await ctx.answerCbQuery('❌ No main category found')
    return false
  }

  if (!isValidSubcategory(mainCategory, selectedSubcategory)) {
    await ctx.answerCbQuery('❌ Invalid subcategory')
    return false
  }

  ctx.wizard.state.subcategory = selectedSubcategory
  await ctx.answerCbQuery()
  return true
}