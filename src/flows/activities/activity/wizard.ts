import { Scenes } from 'telegraf'
import { showCategorySelection, handleCategorySelection } from './steps/1-category'
import { showSubcategorySelection, handleSubcategorySelection } from './steps/2-subcategory'
import { showActivitySelection, handleActivitySelection } from './steps/3-activity'
import { showIntensitySelection, handleIntensitySelection } from './steps/4-intensity'
import { showDateSelection } from './steps/5-date'
import { showDurationSelection, handleDurationInput } from './steps/6-duration'
import { showConfirmation, handleConfirmation } from './steps/7-confirmation'
import { handleCalendarSelection } from '../../../utils/calendar'
import { handleCancel } from './helpers/navigation'

export const sportsActivityWizard = new Scenes.WizardScene<any>(
  'sports_activity_wizard',
  
  // Step 0: Show category selection
  async (ctx: any) => {
    await showCategorySelection(ctx)
    return ctx.wizard.next()
  },

  // Step 1: Handle category, show subcategory
  async (ctx: any) => {
    const result = await handleCategorySelection(ctx)
    if (result) return result

    if (ctx.wizard.state.mainCategory) {
      await showSubcategorySelection(ctx)
      return ctx.wizard.next()
    }
  },

  // Step 2: Handle subcategory, show activity
  async (ctx: any) => {
    const result = await handleSubcategorySelection(ctx)
    if (result) return result

    if (ctx.wizard.state.subcategory) {
      await showActivitySelection(ctx)
      return ctx.wizard.next()
    }
  },

  // Step 3: Handle activity, show intensity
  async (ctx: any) => {
    const result = await handleActivitySelection(ctx)
    if (result) return result

    if (ctx.wizard.state.activity) {
      await showIntensitySelection(ctx)
      return ctx.wizard.next()
    }
  },

  // Step 4: Handle intensity, show date calendar and handle date selection
  async (ctx: any) => {
    // Check if this is a calendar callback
    if (ctx.callbackQuery) {
      const data = ctx.callbackQuery.data
      
      // Handle Back button from date selection
      if (data === 'date:back') {
        await ctx.answerCbQuery()
        delete ctx.wizard.state.intensity
        delete ctx.wizard.state.metValue
        await showIntensitySelection(ctx)
        return
      }
      
      // Handle Cancel button from date selection
      if (data === 'date:cancel') {
        await ctx.answerCbQuery()
        return handleCancel(ctx)
      }
      
      // Handle calendar date selection
      const selectedDate = handleCalendarSelection(ctx)
      console.log('🔍 Step 4 - Calendar returned:', selectedDate) // DEBUG
      
      if (selectedDate) {     
        // Store in session for handleDateSelection to process
        ctx.scene.session.selectedDate = selectedDate
        console.log('🔍 Step 4 - Stored in session:', ctx.scene.session.selectedDate) // DEBUG
        
        // Answer callback
        await ctx.answerCbQuery()
        
        // Use the handler function (consistent with other steps)
        const { handleDateSelection } = await import('./steps/5-date')
        await handleDateSelection(ctx)
        
        console.log('🔍 Step 4 - After handleDateSelection, wizard.state.activityDate:', ctx.wizard.state.activityDate) // DEBUG
        
        // Show duration selection
        await showDurationSelection(ctx)
        
        // Skip step 5 and go to step 6
        ctx.wizard.next() // to 5
        return ctx.wizard.next() // to 6
      } else {
        // Calendar navigation (month change) - just answer the callback
        await ctx.answerCbQuery()
        return
      }
    }
    
    // Handle intensity selection (text input)
    const result = await handleIntensitySelection(ctx)
    if (result) return result
    
    if (ctx.wizard.state.intensity) {
      await showDateSelection(ctx)
      // Stay on step 4 - wait for calendar callback
    }
  },

  // Step 5: Placeholder (skipped by calendar callback)
  async (ctx: any) => {
    await ctx.reply('Please select a date from the calendar above.')
  },

  // Step 6: Handle duration input and move to confirmation
  async (ctx: any) => {
    const result = await handleDurationInput(ctx)
    if (result) return result
    
    if (ctx.wizard.state.duration) {
      await showConfirmation(ctx)
      return ctx.wizard.next()
    }
  },

  // Step 7: Handle confirmation and save
  async (ctx: any) => {
    return await handleConfirmation(ctx)
  }
)