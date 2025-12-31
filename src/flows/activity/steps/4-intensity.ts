import { Markup } from 'telegraf'
import { TwoMessageManager } from '../../../utils/two-message-manager'
import { getIntensities, getMetValue, isValidIntensity } from '../helpers/activity-data'

/**
 * Display intensity selection screen with MET values using inline keyboard
 */
export async function showIntensitySelection(ctx: any): Promise<void> {
  const mainCategory = ctx.wizard.state.mainCategory
  const subcategory = ctx.wizard.state.subcategory
  const activity = ctx.wizard.state.activity
  
  if (!mainCategory || !subcategory || !activity) {
    await TwoMessageManager.updateContent(
      ctx,
      '❌ Error: Missing activity information. Please start over.'
    )
    return
  }

  const intensities = getIntensities(mainCategory, subcategory, activity)
  
  // Create inline keyboard buttons with MET values (1 per row for readability)
  const buttons = intensities.map(intensity => {
    const metValue = getMetValue(mainCategory, subcategory, activity, intensity)
    const label = `${intensity} (${metValue} MET)`
    return [Markup.button.callback(label, `intensity:${intensity}`)]
  })
  
  // Add cancel button
  buttons.push([Markup.button.callback('❌ Cancel', 'intensity:cancel')])

  const message = `🏃 *Log Activity - Step 4/7*\n\n*Activity:* ${activity}\n\nChoose intensity:`
  const keyboard = Markup.inlineKeyboard(buttons)

  await TwoMessageManager.updateContent(ctx, message, keyboard)
}

/**
 * Handle intensity selection from inline button callback
 * @returns true if intensity was selected successfully, false otherwise
 */
export async function handleIntensitySelection(ctx: any): Promise<boolean> {
  // Only process callback queries
  if (!ctx.callbackQuery?.data) {
    return false
  }

  const data = ctx.callbackQuery.data

  // Handle cancel
  if (data === 'intensity:cancel') {
    return false // Let wizard handle the cancel
  }

  // Extract intensity from callback data
  if (!data.startsWith('intensity:')) {
    await ctx.answerCbQuery()
    return false
  }

  const selectedIntensity = data.replace('intensity:', '')
  const mainCategory = ctx.wizard.state.mainCategory
  const subcategory = ctx.wizard.state.subcategory
  const activity = ctx.wizard.state.activity

  // Validate we have required state
  if (!mainCategory || !subcategory || !activity) {
    await ctx.answerCbQuery('❌ Missing activity information')
    return false
  }

  // Validate intensity
  if (!isValidIntensity(mainCategory, subcategory, activity, selectedIntensity)) {
    await ctx.answerCbQuery('❌ Invalid intensity')
    return false
  }

  // Store intensity and MET value in wizard state
  ctx.wizard.state.intensity = selectedIntensity
  ctx.wizard.state.metValue = getMetValue(mainCategory, subcategory, activity, selectedIntensity)
  await ctx.answerCbQuery()
  return true
}