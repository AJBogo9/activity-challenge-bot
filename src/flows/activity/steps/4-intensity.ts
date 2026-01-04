import { Markup } from 'telegraf'
import { TwoMessageManager, escapeMarkdownV2 } from '../../../utils'
import { getIntensities, getMetValue, isValidIntensity } from '../helpers/activity-data'

export async function showIntensitySelection(ctx: any): Promise<void> {
  const mainCategory = ctx.wizard.state.mainCategory
  const subcategory = ctx.wizard.state.subcategory
  const activity = ctx.wizard.state.activity
  
  if (!mainCategory || !subcategory || !activity) {
    await TwoMessageManager.updateContent(
      ctx,
      '❌ Error: Missing activity information\\. Please start over\\.'
    )
    return
  }

  const intensities = getIntensities(mainCategory, subcategory, activity)
  
  const buttons = intensities.map(intensity => {
    const metValue = getMetValue(mainCategory, subcategory, activity, intensity)
    const label = `${intensity} (${metValue} MET)`
    return [Markup.button.callback(label, `intensity:${intensity}`)]
  })
  
  buttons.push([Markup.button.callback('❌ Cancel', 'intensity:cancel')])
  
  const message = `🏃 *Log Activity \\- Step 4/7*\n\n*Activity:* ${escapeMarkdownV2(activity)}\n\nChoose intensity:`
  const keyboard = Markup.inlineKeyboard(buttons)
  
  await TwoMessageManager.updateContent(ctx, message, keyboard)
}

export async function handleIntensitySelection(ctx: any): Promise<boolean> {
  if (!ctx.callbackQuery?.data) {
    return false
  }

  const data = ctx.callbackQuery.data

  if (data === 'intensity:cancel') {
    return false
  }

  if (!data.startsWith('intensity:')) {
    await ctx.answerCbQuery()
    return false
  }

  const selectedIntensity = data.replace('intensity:', '')
  const mainCategory = ctx.wizard.state.mainCategory
  const subcategory = ctx.wizard.state.subcategory
  const activity = ctx.wizard.state.activity

  if (!mainCategory || !subcategory || !activity) {
    await ctx.answerCbQuery('❌ Missing activity information')
    return false
  }

  if (!isValidIntensity(mainCategory, subcategory, activity, selectedIntensity)) {
    await ctx.answerCbQuery('❌ Invalid intensity')
    return false
  }

  ctx.wizard.state.intensity = selectedIntensity
  ctx.wizard.state.metValue = getMetValue(mainCategory, subcategory, activity, selectedIntensity)
  await ctx.answerCbQuery()
  return true
}