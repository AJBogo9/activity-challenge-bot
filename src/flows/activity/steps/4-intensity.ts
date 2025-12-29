import { Markup } from 'telegraf'
import { createKeyboard, addMetValuesToIntensities, extractIntensityFromLabel } from '../helpers/keyboard-builder'
import { getIntensities, getMetValue, isValidIntensity } from '../helpers/activity-data'

/**
 * Display intensity selection screen with MET values
 */
export async function showIntensitySelection(ctx: any): Promise<void> {
  const mainCategory = ctx.wizard.state.mainCategory
  const subcategory = ctx.wizard.state.subcategory
  const activity = ctx.wizard.state.activity

  if (!mainCategory || !subcategory || !activity) {
    await ctx.reply('❌ Error: Missing activity information. Please start over.')
    return
  }

  const intensities = getIntensities(mainCategory, subcategory, activity)
  const intensitiesWithMET = addMetValuesToIntensities(
    intensities, 
    mainCategory, 
    subcategory, 
    activity,
  )
  const keyboard = createKeyboard(intensitiesWithMET, true)

  await ctx.replyWithMarkdown(
    `🏃 *Log Activity - Step 4/7*\n\n*Activity:* ${activity}\n\nChoose intensity:`,
    Markup.keyboard(keyboard).resize().oneTime()
  )
}

/**
 * Handle intensity selection from user input
 * @returns true if intensity was selected successfully, false otherwise
 */
export async function handleIntensitySelection(ctx: any): Promise<boolean> {
  // Only process text messages
  if (!ctx.message?.text) {
    return false
  }

  const input = ctx.message.text.trim()

  // Handle cancel (before extracting intensity)
  if (input === '❌ Cancel') {
    return false // Let wizard handle the cancel
  }

  const selectedIntensity = extractIntensityFromLabel(input)
  const mainCategory = ctx.wizard.state.mainCategory
  const subcategory = ctx.wizard.state.subcategory
  const activity = ctx.wizard.state.activity

  // Validate we have required state
  if (!mainCategory || !subcategory || !activity) {
    await ctx.reply('❌ Error: Missing activity information. Please start over.')
    return false
  }

  // Validate intensity
  if (!isValidIntensity(mainCategory, subcategory, activity, selectedIntensity)) {
    await ctx.reply('❌ Invalid intensity. Please choose from the options provided.')
    return false
  }

  // Store intensity and MET value in wizard state
  ctx.wizard.state.intensity = selectedIntensity
  ctx.wizard.state.metValue = getMetValue(mainCategory, subcategory, activity, selectedIntensity)
  return true
}