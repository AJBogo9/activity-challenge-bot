import { Markup } from 'telegraf'
import { TwoMessageManager, escapeMarkdownV2 } from '../../../utils'
import { getActivities, isValidActivity } from '../helpers/activity-data'

export async function showActivitySelection(ctx: any): Promise<void> {
  const mainCategory = ctx.wizard.state.mainCategory
  const subcategory = ctx.wizard.state.subcategory
  
  if (!mainCategory || !subcategory) {
    await TwoMessageManager.updateContent(
      ctx, 
      '❌ Error: Missing category information\\. Please start over\\.'
    )
    return
  }

  const activities = getActivities(mainCategory, subcategory)
  
  const buttons = []
  for (let i = 0; i < activities.length; i += 2) {
    const row = [
      Markup.button.callback(activities[i], `activity:${activities[i]}`)
    ]
    if (i + 1 < activities.length) {
      row.push(Markup.button.callback(activities[i + 1], `activity:${activities[i + 1]}`))
    }
    buttons.push(row)
  }
  
  buttons.push([Markup.button.callback('❌ Cancel', 'activity:cancel')])
  
  const message = `🏃 *Log Activity \\- Step 3/7*\n\n*Subcategory:* ${escapeMarkdownV2(subcategory)}\n\nChoose specific activity:`
  const keyboard = Markup.inlineKeyboard(buttons)
  
  await TwoMessageManager.updateContent(ctx, message, keyboard)
}

export async function handleActivitySelection(ctx: any): Promise<boolean> {
  if (!ctx.callbackQuery?.data) {
    return false
  }

  const data = ctx.callbackQuery.data

  if (data === 'activity:cancel') {
    return false
  }

  if (!data.startsWith('activity:')) {
    await ctx.answerCbQuery()
    return false
  }

  const selectedActivity = data.replace('activity:', '')
  const mainCategory = ctx.wizard.state.mainCategory
  const subcategory = ctx.wizard.state.subcategory

  if (!mainCategory || !subcategory) {
    await ctx.answerCbQuery('❌ Missing category information')
    return false
  }

  if (!isValidActivity(mainCategory, subcategory, selectedActivity)) {
    await ctx.answerCbQuery('❌ Invalid activity')
    return false
  }

  ctx.wizard.state.activity = selectedActivity
  await ctx.answerCbQuery()
  return true
}