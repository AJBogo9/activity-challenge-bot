import { Markup } from 'telegraf'
import { createKeyboard, addMetValuesToIntensities, extractIntensityFromLabel } from '../helpers/keyboard-builder'
import { hierarchy, getIntensities, getActivities, getMetValue, isValidIntensity } from '../helpers/activity-data'
import { handleCancel, isCancel, isBack } from '../helpers/navigation'

export async function showIntensitySelection(ctx: any) {
  const mainCat = ctx.wizard.state.mainCategory
  const subCat = ctx.wizard.state.subcategory
  const activity = ctx.wizard.state.activity
  const intensities = getIntensities(mainCat, subCat, activity)
  const intensitiesWithMET = addMetValuesToIntensities(intensities, mainCat, subCat, activity, hierarchy)
  const keyboard = createKeyboard(intensitiesWithMET, true)
  
  await ctx.replyWithMarkdown(
    `🏃 *Log Activity - Step 4/6*\n\n*Activity:* ${activity}\n\nChoose intensity:`,
    Markup.keyboard(keyboard).resize().oneTime()
  )
}

export async function handleIntensitySelection(ctx: any) {
    // Only handle text messages (keyboard buttons)
  const input = ctx.message?.text
  
  if (!input) {
    await ctx.reply('Please select an intensity from the options.')
    return
  }
  
  if (isCancel(input)) {
    return handleCancel(ctx)
  }

  if (isBack(input)) {
    delete ctx.wizard.state.activity
    ctx.wizard.selectStep(2)
    const mainCat = ctx.wizard.state.mainCategory
    const subCat = ctx.wizard.state.subcategory
    const activities = getActivities(mainCat, subCat)
    const keyboard = createKeyboard(activities, true)
    await ctx.replyWithMarkdown(
      `🏃 *Log Activity - Step 3/6*\n\n*Subcategory:* ${subCat}\n\nChoose specific activity:`,
      Markup.keyboard(keyboard).resize().oneTime()
    )
    return 'back'
  }

  const selectedIntensity = extractIntensityFromLabel(input)
  const mainCat = ctx.wizard.state.mainCategory
  const subCat = ctx.wizard.state.subcategory
  const activity = ctx.wizard.state.activity

  if (!isValidIntensity(mainCat, subCat, activity, selectedIntensity)) {
    await ctx.reply('Invalid intensity. Please choose from the options.')
    return
  }

  ctx.wizard.state.intensity = selectedIntensity
  ctx.wizard.state.metValue = getMetValue(mainCat, subCat, activity, selectedIntensity)
}