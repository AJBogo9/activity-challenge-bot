import { Scenes } from 'telegraf'
import { TwoMessageManager } from '../../utils/two-message-manager'
import { showCategorySelection, handleCategorySelection } from './steps/1-category'
import { showSubcategorySelection, handleSubcategorySelection } from './steps/2-subcategory'
import { showActivitySelection, handleActivitySelection } from './steps/3-activity'
import { showIntensitySelection, handleIntensitySelection } from './steps/4-intensity'
import { showDateSelection, handleDateSelection } from './steps/5-date'
import { showDurationSelection, handleDurationInput } from './steps/6-duration'
import { showConfirmation, handleConfirmation } from './steps/7-confirm'
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
  calculatedPoints?: number
}

export const activityWizard = new Scenes.WizardScene<any>(
  'activity_wizard',
  
  // Step 0: Show Category Selection (edit content message only)
  async (ctx: any) => {
    // Just show the category selection - don't initialize
    await showCategorySelection(ctx)
    return ctx.wizard.next()
  },

  // Step 1: Handle Category → Show Subcategory
  async (ctx: any) => {
    if (ctx.callbackQuery?.data === 'category:cancel') {
      await handleCancel(ctx)
      return
    }

    const success = await handleCategorySelection(ctx)
    if (!success || !ctx.wizard.state.mainCategory) {
      return
    }

    await showSubcategorySelection(ctx)
    return ctx.wizard.next()
  },

  // Step 2: Handle Subcategory → Show Activity
  async (ctx: any) => {
    if (ctx.callbackQuery?.data === 'subcategory:cancel') {
      await handleCancel(ctx)
      return
    }

    const success = await handleSubcategorySelection(ctx)
    if (!success || !ctx.wizard.state.subcategory) {
      return
    }

    await showActivitySelection(ctx)
    return ctx.wizard.next()
  },

  // Step 3: Handle Activity → Show Intensity
  async (ctx: any) => {
    if (ctx.callbackQuery?.data === 'activity:cancel') {
      await handleCancel(ctx)
      return
    }

    const success = await handleActivitySelection(ctx)
    if (!success || !ctx.wizard.state.activity) {
      return
    }

    await showIntensitySelection(ctx)
    return ctx.wizard.next()
  },

  // Step 4: Handle Intensity → Show Date
  async (ctx: any) => {
    if (ctx.callbackQuery?.data === 'intensity:cancel') {
      await handleCancel(ctx)
      return
    }

    const success = await handleIntensitySelection(ctx)
    if (!success || !ctx.wizard.state.intensity) {
      return
    }

    await showDateSelection(ctx)
    return ctx.wizard.next()
  },

  // Step 5: Handle Date → Show Duration
  async (ctx: any) => {
    if (ctx.callbackQuery?.data === 'date:cancel') {
      await handleCancel(ctx)
      return
    }

    await handleDateSelection(ctx)
    
    if (!ctx.wizard.state.activityDate) {
      if (ctx.callbackQuery) {
        await ctx.answerCbQuery()
      }
      return
    }

    if (ctx.callbackQuery) {
      await ctx.answerCbQuery()
    }
    await showDurationSelection(ctx)
    return ctx.wizard.next()
  },

  // Step 6: Handle Duration → Show Confirmation
  async (ctx: any) => {
    if (ctx.callbackQuery?.data === 'duration:cancel') {
      await handleCancel(ctx)
      return
    }

    await handleDurationInput(ctx)
    if (!ctx.wizard.state.duration) {
      return
    }

    await showConfirmation(ctx)
    return ctx.wizard.next()
  },

  // Step 7: Handle Confirmation → Save
  async (ctx: any) => {
    if (ctx.callbackQuery?.data === 'confirm:cancel') {
      await handleCancel(ctx)
      return
    }
    
    await handleConfirmation(ctx)
  }
)

// Clean up on wizard leave
activityWizard.leave(async (ctx: any) => {
  // Clear wizard state
  ctx.wizard.state = {}
})