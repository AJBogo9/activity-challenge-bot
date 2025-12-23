import { Scenes } from 'telegraf'
import { showCategorySelection, handleCategorySelection } from './sports-activity/steps/category-step'
import { showSubcategorySelection, handleSubcategorySelection } from './sports-activity/steps/subcategory-step'
import { showActivitySelection, handleActivitySelection } from './sports-activity/steps/activity-step'
import { showIntensitySelection, handleIntensitySelection } from './sports-activity/steps/intensity-step'
import { showDateSelection } from './sports-activity/steps/date-step'
import { showDurationSelection, handleDurationAndSave } from './sports-activity/steps/duration-step'
import { handleCalendarSelection } from '../../utils/calendar'
import { handleCancel } from './sports-activity/helpers/navigation'

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
        // Stay on step 4
        return
      }
      
      // Handle Cancel button from date selection
      if (data === 'date:cancel') {
        await ctx.answerCbQuery()
        return handleCancel(ctx)
      }
      
      // Handle calendar date selection
      const selectedDate = handleCalendarSelection(ctx)
      
      if (selectedDate) {
        console.log(`📅 Date selected in wizard: ${selectedDate}`)
        
        // Store in session for handleDateSelection to process
        ctx.scene.session.selectedDate = selectedDate
        
        // Answer callback
        await ctx.answerCbQuery()
        
        // Use the handler function (consistent with other steps)
        const { handleDateSelection } = await import('./sports-activity/steps/date-step')
        await handleDateSelection(ctx)
        
        // Show duration selection
        await showDurationSelection(ctx)
        
        // Skip step 5 and go to step 6
        ctx.wizard.next() // to 5
        return ctx.wizard.next() // to 6
      } else {
        // Calendar navigation (month change) - just answer the callback
        // The calendar library already handled updating the message
        await ctx.answerCbQuery()
        return // Stop here - don't process as intensity selection
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

  // Step 6: Handle duration and save
  handleDurationAndSave
)