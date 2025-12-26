import { Scenes } from 'telegraf'
import { showCategorySelection, handleCategorySelection } from './steps/1-category'
import { showSubcategorySelection, handleSubcategorySelection } from './steps/2-subcategory'
import { showActivitySelection, handleActivitySelection } from './steps/3-activity'
import { showIntensitySelection, handleIntensitySelection } from './steps/4-intensity'
import { showDateSelection, handleDateSelection } from './steps/5-date'
import { showDurationSelection, handleDurationInput } from './steps/6-duration'
import { showConfirmation, handleConfirmation } from './steps/7-confirmation'
import { handleCancel } from './helpers/navigation'

// Wizard state interface for type safety
interface WizardState {
  mainCategory?: string
  subcategory?: string
  activity?: string
  intensity?: string
  metValue?: number
  activityDate?: Date
  duration?: number
}

// Navigation helper
const goBack = async (ctx: any, showPrevious: Function) => {
  await ctx.answerCbQuery()
  await showPrevious(ctx)
}

export const sportsActivityWizard = new Scenes.WizardScene<any>(
  'sports_activity_wizard',
  
  // Step 0: Category Selection
  async (ctx: any) => {
    await showCategorySelection(ctx)
    return ctx.wizard.next()
  },

  // Step 1: Handle Category → Show Subcategory
  async (ctx: any) => {
    // Handle back/cancel
    if (ctx.callbackQuery?.data === 'category:back') {
      await handleCancel(ctx)
      return
    }
    if (ctx.callbackQuery?.data === 'category:cancel') {
      await handleCancel(ctx)
      return
    }

    const success = await handleCategorySelection(ctx)
    if (!success || !ctx.wizard.state.mainCategory) {
      await ctx.reply('Please select a category.')
      return
    }

    await showSubcategorySelection(ctx)
    return ctx.wizard.next()
  },

  // Step 2: Handle Subcategory → Show Activity
  async (ctx: any) => {
    if (ctx.callbackQuery?.data === 'subcategory:back') {
      delete ctx.wizard.state.mainCategory
      await goBack(ctx, showCategorySelection)
      return ctx.wizard.back()
    }
    if (ctx.callbackQuery?.data === 'subcategory:cancel') {
      await handleCancel(ctx)
      return
    }

    const success = await handleSubcategorySelection(ctx)
    if (!success || !ctx.wizard.state.subcategory) {
      await ctx.reply('Please select a subcategory.')
      return
    }

    await showActivitySelection(ctx)
    return ctx.wizard.next()
  },

  // Step 3: Handle Activity → Show Intensity
  async (ctx: any) => {
    if (ctx.callbackQuery?.data === 'activity:back') {
      delete ctx.wizard.state.subcategory
      await goBack(ctx, showSubcategorySelection)
      return ctx.wizard.back()
    }
    if (ctx.callbackQuery?.data === 'activity:cancel') {
      await handleCancel(ctx)
      return
    }

    const success = await handleActivitySelection(ctx)
    if (!success || !ctx.wizard.state.activity) {
      await ctx.reply('Please select an activity.')
      return
    }

    await showIntensitySelection(ctx)
    return ctx.wizard.next()
  },

  // Step 4: Handle Intensity → Show Date
  async (ctx: any) => {
    if (ctx.callbackQuery?.data === 'intensity:back') {
      delete ctx.wizard.state.activity
      delete ctx.wizard.state.metValue
      await goBack(ctx, showActivitySelection)
      return ctx.wizard.back()
    }
    if (ctx.callbackQuery?.data === 'intensity:cancel') {
      await handleCancel(ctx)
      return
    }

    const success = await handleIntensitySelection(ctx)
    if (!success || !ctx.wizard.state.intensity) {
      await ctx.reply('Please select an intensity level.')
      return
    }

    await showDateSelection(ctx)
    return ctx.wizard.next()
  },

  // Step 5: Handle Date → Show Duration
  async (ctx: any) => {
    if (ctx.callbackQuery?.data === 'date:back') {
      delete ctx.wizard.state.intensity
      delete ctx.wizard.state.metValue
      await goBack(ctx, showIntensitySelection)
      return ctx.wizard.back()
    }
    if (ctx.callbackQuery?.data === 'date:cancel') {
      await handleCancel(ctx)
      return
    }

    // Handle date selection (calendar callback)
    await handleDateSelection(ctx)
    
    // If date not selected yet, wait
    if (!ctx.wizard.state.activityDate) {
      // Could be calendar navigation or no selection yet
      // Just answer callback if present and stay on this step
      if (ctx.callbackQuery) {
        await ctx.answerCbQuery()
      }
      return
    }

    // Date was selected, proceed
    await ctx.answerCbQuery()
    await showDurationSelection(ctx)
    return ctx.wizard.next()
  },

  // Step 6: Handle Duration → Show Confirmation
  async (ctx: any) => {
    if (ctx.callbackQuery?.data === 'duration:back') {
      delete ctx.wizard.state.activityDate
      await goBack(ctx, showDateSelection)
      return ctx.wizard.back()
    }
    if (ctx.callbackQuery?.data === 'duration:cancel') {
      await handleCancel(ctx)
      return
    }

    await handleDurationInput(ctx)
    if (!ctx.wizard.state.duration) {
      await ctx.reply('Please enter a valid duration in minutes.')
      return
    }

    await showConfirmation(ctx)
    return ctx.wizard.next()
  },

  // Step 7: Handle Confirmation → Save
  async (ctx: any) => {
    await handleConfirmation(ctx)
  }
)