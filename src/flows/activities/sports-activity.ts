import { Scenes } from 'telegraf'
import { showCategorySelection, handleCategorySelection } from './sports-activity/steps/category-step'
import { showSubcategorySelection, handleSubcategorySelection } from './sports-activity/steps/subcategory-step'
import { showActivitySelection, handleActivitySelection } from './sports-activity/steps/activity-step'
import { showIntensitySelection, handleIntensitySelection } from './sports-activity/steps/intensity-step'
import { showDateSelection, handleDateSelection } from './sports-activity/steps/date-step'
import { showDurationSelection, handleDurationAndSave } from './sports-activity/steps/duration-step'

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
  
  // Step 4: Handle intensity, show date
  async (ctx: any) => {
    const result = await handleIntensitySelection(ctx)
    if (result) return result
    if (ctx.wizard.state.intensity) {
      await showDateSelection(ctx)
      return ctx.wizard.next()
    }
  },
  
  // Step 5: Handle date, show duration
  async (ctx: any) => {
    const result = await handleDateSelection(ctx)
    if (result) return result
    if (ctx.wizard.state.activityDate) {
      await showDurationSelection(ctx)
      return ctx.wizard.next()
    }
  },
  
  // Step 6: Handle duration and save
  handleDurationAndSave
)