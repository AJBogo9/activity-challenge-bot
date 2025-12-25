import { Markup } from 'telegraf'
import { createKeyboard } from '../helpers/keyboard-builder'
import { getActivities, getSubcategories, isValidActivity } from '../helpers/activity-data'
import { handleCancel, isCancel, isBack } from '../helpers/navigation'

export async function showActivitySelection(ctx: any) {
  const mainCat = ctx.wizard.state.mainCategory
  const subCat = ctx.wizard.state.subcategory
  const activities = getActivities(mainCat, subCat)
  const keyboard = createKeyboard(activities, true)
  
  await ctx.replyWithMarkdown(
    `🏃 *Log Activity - Step 3/6*\n\n*Subcategory:* ${subCat}\n\nChoose specific activity:`,
    Markup.keyboard(keyboard).resize().oneTime()
  )
}

export async function handleActivitySelection(ctx: any) {
  const input = ctx.message?.text
  
  if (isCancel(input)) {
    return handleCancel(ctx)
  }
  
  if (isBack(input)) {
    delete ctx.wizard.state.subcategory
    ctx.wizard.selectStep(1)
    const mainCat = ctx.wizard.state.mainCategory
    const subcategories = getSubcategories(mainCat)
    const keyboard = createKeyboard(subcategories, true)
    
    await ctx.replyWithMarkdown(
      `🏃 *Log Activity - Step 2/6*\n\n*Category:* ${mainCat}\n\nChoose a subcategory:`,
      Markup.keyboard(keyboard).resize().oneTime()
    )
    return 'back'
  }
  
  const mainCat = ctx.wizard.state.mainCategory
  const subCat = ctx.wizard.state.subcategory
  const selectedActivity = input
  
  if (!isValidActivity(mainCat, subCat, selectedActivity)) {
    await ctx.reply('Invalid activity. Please choose from the options.')
    return
  }
  
  ctx.wizard.state.activity = selectedActivity
}