import { Scenes, Markup } from 'telegraf'
import activitiesData from '../../../data/processed/4_level_hierarchy.json'
import { findUserByTelegramId, updateUserPoints } from '../../db/users'
import { createActivity } from '../../db/activities'

interface ActivityData {
  met_value: number
  examples: string
}

interface IntensityLevel {
  [intensity: string]: ActivityData[]
}

interface Activities {
  [activity: string]: IntensityLevel
}

interface Subcategories {
  [subcategory: string]: Activities | IntensityLevel
}

interface MainCategories {
  [mainCategory: string]: Subcategories
}

const hierarchy = activitiesData as MainCategories

// Helper function to create keyboard layout
function createKeyboard(items: string[], includeBack: boolean = false): string[][] {
  const keyboard: string[][] = []
  
  if (items.length <= 3) {
    items.forEach(item => keyboard.push([item]))
  } else {
    for (let i = 0; i < items.length; i += 2) {
      if (i + 1 < items.length) {
        keyboard.push([items[i], items[i + 1]])
      } else {
        keyboard.push([items[i]])
      }
    }
  }
  
  if (includeBack) {
    keyboard.push(['⬅️ Back', '❌ Cancel'])
  } else {
    keyboard.push(['❌ Cancel'])
  }
  
  return keyboard
}

export const quickStartWizard = new Scenes.WizardScene<any>(
  'quick_start_wizard',
  
  // Step 0: Choose Intensity (starts here directly)
  async (ctx: any) => {
    const { mainCategory, subcategory, activity, skipActivityStep } = ctx.scene.state
    
    if (!mainCategory || !subcategory || !activity) {
      await ctx.reply('Invalid activity data. Please try again.', Markup.removeKeyboard())
      return ctx.scene.enter('registered_menu')
    }

    const activityData = skipActivityStep
      ? hierarchy[mainCategory][subcategory] as IntensityLevel
      : (hierarchy[mainCategory][subcategory] as Activities)[activity]
    
    const intensities = Object.keys(activityData)
    
    // Add MET values to button labels
    const intensitiesWithMET = intensities.map(intensity => {
      const metValue = activityData[intensity][0].met_value
      return `${intensity} (${metValue} MET)`
    })
    
    const keyboard = createKeyboard(intensitiesWithMET, false)
    
    await ctx.replyWithMarkdown(
      `🏃 *Quick Log Activity - Step 1/2*\n\n*Activity:* ${activity}\n\nChoose intensity:`,
      Markup.keyboard(keyboard).resize().oneTime()
    )
    
    return ctx.wizard.next()
  },
  
  // Step 1: Handle Intensity selection and show Duration
  async (ctx: any) => {
    const selectedIntensityWithMET = ctx.message?.text
    
    if (selectedIntensityWithMET === '❌ Cancel') {
      await ctx.reply('Activity logging cancelled.', Markup.removeKeyboard())
      return ctx.scene.enter('registered_menu')
    }
    
    // This shouldn't happen at step 1 since there's no back button, but handle it
    if (selectedIntensityWithMET === '⬅️ Back') {
      const { mainCategory, subcategory, activity, skipActivityStep } = ctx.wizard.state
      
      const activityData = skipActivityStep
        ? hierarchy[mainCategory][subcategory] as IntensityLevel
        : (hierarchy[mainCategory][subcategory] as Activities)[activity]
      
      const intensities = Object.keys(activityData)
      
      const intensitiesWithMET = intensities.map(intensity => {
        const metValue = activityData[intensity][0].met_value
        return `${intensity} (${metValue} MET)`
      })
      
      const keyboard = createKeyboard(intensitiesWithMET, false)
      
      await ctx.replyWithMarkdown(
        `🏃 *Quick Log Activity - Step 1/2*\n\n*Activity:* ${activity}\n\nChoose intensity:`,
        Markup.keyboard(keyboard).resize().oneTime()
      )
      return
    }
    
    // Extract intensity name from "Intensity (X MET)" format
    const intensityMatch = selectedIntensityWithMET?.match(/^(.+?)\s*\([\d.]+\s*MET\)$/)
    const selectedIntensity = intensityMatch ? intensityMatch[1] : selectedIntensityWithMET
    
    const { mainCategory, subcategory, activity, skipActivityStep } = ctx.wizard.state
    
    const activityData = skipActivityStep
      ? hierarchy[mainCategory][subcategory] as IntensityLevel
      : (hierarchy[mainCategory][subcategory] as Activities)[activity]
    
    if (!activityData[selectedIntensity]) {
      await ctx.reply('Invalid intensity. Please choose from the options.')
      return
    }
    
    ctx.wizard.state.intensity = selectedIntensity
    ctx.wizard.state.metValue = activityData[selectedIntensity][0].met_value
    
    // Create inline keyboard with common duration options
    await ctx.replyWithMarkdown(
      `🏃 *Quick Log Activity - Step 2/2*\n\n*Activity:* ${activity}\n*Intensity:* ${selectedIntensity}\n*MET Value:* ${ctx.wizard.state.metValue}\n\nHow many minutes did you exercise?\n\n_Tap a quick option below or type a custom number:_`,
      Markup.inlineKeyboard([
        [
          Markup.button.callback('15 min', 'quick_duration:15'),
          Markup.button.callback('20 min', 'quick_duration:20'),
          Markup.button.callback('30 min', 'quick_duration:30')
        ],
        [
          Markup.button.callback('45 min', 'quick_duration:45'),
          Markup.button.callback('60 min', 'quick_duration:60'),
          Markup.button.callback('90 min', 'quick_duration:90')
        ],
        [
          Markup.button.callback('120 min', 'quick_duration:120'),
          Markup.button.callback('⬅️ Back', 'quick_duration:back'),
          Markup.button.callback('❌ Cancel', 'quick_duration:cancel')
        ]
      ])
    )
    
    return ctx.wizard.next()
  },
  
  // Step 2: Handle Duration and Save
  async (ctx: any) => {
    let minutes: number
    
    // Handle inline button callback
    if (ctx.callbackQuery?.data) {
      const data = ctx.callbackQuery.data
      
      if (data === 'quick_duration:cancel') {
        await ctx.answerCbQuery()
        await ctx.reply('Activity logging cancelled.', Markup.removeKeyboard())
        return ctx.scene.enter('registered_menu')
      }
      
      if (data === 'quick_duration:back') {
        await ctx.answerCbQuery()
        
        // Clean up state
        delete ctx.wizard.state.intensity
        delete ctx.wizard.state.metValue
        
        const { mainCategory, subcategory, activity, skipActivityStep } = ctx.wizard.state
        
        const activityData = skipActivityStep
          ? hierarchy[mainCategory][subcategory] as IntensityLevel
          : (hierarchy[mainCategory][subcategory] as Activities)[activity]
        
        const intensities = Object.keys(activityData)
        
        const intensitiesWithMET = intensities.map(intensity => {
          const metValue = activityData[intensity][0].met_value
          return `${intensity} (${metValue} MET)`
        })
        
        const keyboard = createKeyboard(intensitiesWithMET, false)
        
        await ctx.replyWithMarkdown(
          `🏃 *Quick Log Activity - Step 1/2*\n\n*Activity:* ${activity}\n\nChoose intensity:`,
          Markup.keyboard(keyboard).resize().oneTime()
        )
        
        return ctx.wizard.back()
      }
      
      if (data.startsWith('quick_duration:')) {
        await ctx.answerCbQuery()
        const durationStr = data.split(':')[1]
        minutes = parseInt(durationStr)
      } else {
        await ctx.answerCbQuery()
        return
      }
    }
    // Handle text input
    else if (ctx.message?.text) {
      const duration = ctx.message.text
      
      if (duration === '❌ Cancel') {
        await ctx.reply('Activity logging cancelled.', Markup.removeKeyboard())
        return ctx.scene.enter('registered_menu')
      }
      
      if (duration === '⬅️ Back') {
        // Clean up state
        delete ctx.wizard.state.intensity
        delete ctx.wizard.state.metValue
        
        const { mainCategory, subcategory, activity, skipActivityStep } = ctx.wizard.state
        
        const activityData = skipActivityStep
          ? hierarchy[mainCategory][subcategory] as IntensityLevel
          : (hierarchy[mainCategory][subcategory] as Activities)[activity]
        
        const intensities = Object.keys(activityData)
        
        const intensitiesWithMET = intensities.map(intensity => {
          const metValue = activityData[intensity][0].met_value
          return `${intensity} (${metValue} MET)`
        })
        
        const keyboard = createKeyboard(intensitiesWithMET, false)
        
        await ctx.replyWithMarkdown(
          `🏃 *Quick Log Activity - Step 1/2*\n\n*Activity:* ${activity}\n\nChoose intensity:`,
          Markup.keyboard(keyboard).resize().oneTime()
        )
        
        return ctx.wizard.back()
      }
      
      minutes = parseInt(duration)
    } else {
      return
    }
    
    if (isNaN(minutes) || minutes <= 0) {
      await ctx.reply('Please enter a valid number of minutes (e.g., 30)')
      return
    }
    
    ctx.wizard.state.duration = minutes
    
    // Calculate points (MET * minutes / 60)
    const points = Number(((ctx.wizard.state.metValue * minutes) / 60).toFixed(2))
    
    try {
      const user = await findUserByTelegramId(ctx.from.id.toString())
      
      if (!user) {
        await ctx.reply('User not found. Please register first with /start', Markup.removeKeyboard())
        return ctx.scene.enter('registered_menu')
      }
      
      await createActivity({
        userId: user.id,
        activityType: `${ctx.wizard.state.mainCategory} - ${ctx.wizard.state.activity}`,
        duration: minutes,
        points: points,
        description: `${ctx.wizard.state.intensity} intensity`
      })
      
      await updateUserPoints(user.id, points)
      
      const newTotalPoints = Number(user.points || 0) + points
      
      const summary = `
✅ *Activity Logged Successfully!*

📋 *Summary:*
• *Category:* ${ctx.wizard.state.mainCategory}
• *Activity:* ${ctx.wizard.state.activity}
• *Intensity:* ${ctx.wizard.state.intensity}
• *Duration:* ${minutes} minutes
• *MET Value:* ${ctx.wizard.state.metValue}

🎯 *Points Earned:* ${points}
📊 *Total Points:* ${newTotalPoints}
`
      
      await ctx.replyWithMarkdown(summary, Markup.removeKeyboard())
      
    } catch (error) {
      console.error('Error saving activity:', error)
      await ctx.reply('❌ An error occurred while saving your activity. Please try again later.', Markup.removeKeyboard())
    }
    
    return ctx.scene.enter('registered_menu')
  }
)