import { Scenes } from 'telegraf'
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
}

export const sportsActivityWizard = new Scenes.WizardScene<any>(
  'sports_activity_wizard',
  
  // Step 0: Category Selection (INLINE KEYBOARD)
  async (ctx: any) => {
    await showCategorySelection(ctx)
    return ctx.wizard.next()
  },

  // Step 1: Handle Category → Show Subcategory (INLINE KEYBOARD)
  async (ctx: any) => {
    // Handle cancel callback for inline keyboard
    if (ctx.callbackQuery?.data === 'category:cancel') {
      await handleCancel(ctx)
      return
    }

    const success = await handleCategorySelection(ctx)
    if (!success || !ctx.wizard.state.mainCategory) {
      // Wait for valid selection
      return
    }

    await showSubcategorySelection(ctx)
    return ctx.wizard.next()
  },

  // Step 2: Handle Subcategory → Show Activity (INLINE KEYBOARD)
  async (ctx: any) => {
    // Handle cancel callback for inline keyboard
    if (ctx.callbackQuery?.data === 'subcategory:cancel') {
      await handleCancel(ctx)
      return
    }

    const success = await handleSubcategorySelection(ctx)
    if (!success || !ctx.wizard.state.subcategory) {
      // Wait for valid selection
      return
    }

    await showActivitySelection(ctx)
    return ctx.wizard.next()
  },

  // Step 3: Handle Activity → Show Intensity (INLINE KEYBOARD)
  async (ctx: any) => {
    // Handle cancel callback for inline keyboard
    if (ctx.callbackQuery?.data === 'activity:cancel') {
      await handleCancel(ctx)
      return
    }

    const success = await handleActivitySelection(ctx)
    if (!success || !ctx.wizard.state.activity) {
      // Wait for valid selection
      return
    }

    await showIntensitySelection(ctx)
    return ctx.wizard.next()
  },

  // Step 4: Handle Intensity → Show Date (INLINE KEYBOARD)
  async (ctx: any) => {
    // Handle cancel callback for inline keyboard
    if (ctx.callbackQuery?.data === 'intensity:cancel') {
      await handleCancel(ctx)
      return
    }

    const success = await handleIntensitySelection(ctx)
    if (!success || !ctx.wizard.state.intensity) {
      // Wait for valid selection
      return
    }

    await showDateSelection(ctx)
    return ctx.wizard.next()
  },

  // Step 5: Handle Date → Show Duration (INLINE KEYBOARD)
  async (ctx: any) => {
    // Handle cancel callback for inline keyboard
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
    if (ctx.callbackQuery) {
      await ctx.answerCbQuery()
    }
    await showDurationSelection(ctx)
    return ctx.wizard.next()
  },

  // Step 6: Handle Duration → Show Confirmation (INLINE KEYBOARD)
  async (ctx: any) => {
    // Handle cancel callback for inline keyboard
    if (ctx.callbackQuery?.data === 'duration:cancel') {
      await handleCancel(ctx)
      return
    }

    await handleDurationInput(ctx)
    if (!ctx.wizard.state.duration) {
      // Wait for valid duration input
      return
    }

    await showConfirmation(ctx)
    return ctx.wizard.next()
  },

  // Step 7: Handle Confirmation → Save (INLINE KEYBOARD)
  async (ctx: any) => {
    // Handle cancel callback for inline keyboard
    if (ctx.callbackQuery?.data === 'confirm:cancel') {
      await handleCancel(ctx)
      return
    }
    
    await handleConfirmation(ctx)
  }
)