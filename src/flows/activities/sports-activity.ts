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
  [subcategory: string]: Activities
}

interface MainCategories {
  [mainCategory: string]: Subcategories
}

const hierarchy = activitiesData as MainCategories

// Helper function to create keyboard layout
function createKeyboard(items: string[], includeBack: boolean = false): string[][] {
  const keyboard: string[][] = []
  
  // If 3 or fewer items, use single column
  if (items.length <= 3) {
    items.forEach(item => keyboard.push([item]))
  } else {
    // Use 2-column layout for more than 3 items
    for (let i = 0; i < items.length; i += 2) {
      if (i + 1 < items.length) {
        keyboard.push([items[i], items[i + 1]])
      } else {
        keyboard.push([items[i]])
      }
    }
  }
  
  // Add navigation buttons
  if (includeBack) {
    keyboard.push(['⬅️ Back', '❌ Cancel'])
  } else {
    keyboard.push(['❌ Cancel'])
  }
  
  return keyboard
}

export const sportsActivityWizard = new Scenes.WizardScene<any>(
  'sports_activity_wizard',
  
  // Step 0: Choose Main Category
  async (ctx: any) => {
    const mainCategories = Object.keys(hierarchy)
    const keyboard = createKeyboard(mainCategories)
    
    await ctx.replyWithMarkdown(
      '🏃 *Log Activity - Step 1/5*\n\nChoose a main category:',
      Markup.keyboard(keyboard).resize().oneTime()
    )
    
    return ctx.wizard.next()
  },
  
  // Step 1: Handle Main Category selection and show Subcategory
  async (ctx: any) => {
    const input = ctx.message?.text
    
    if (input === '❌ Cancel') {
      await ctx.reply('Activity logging cancelled.', Markup.removeKeyboard())
      return ctx.scene.enter('registered_menu')
    }
    
    // This shouldn't happen at step 1, but handle it just in case
    if (input === '⬅️ Back') {
      const mainCategories = Object.keys(hierarchy)
      const keyboard = createKeyboard(mainCategories)
      
      await ctx.replyWithMarkdown(
        '🏃 *Log Activity - Step 1/5*\n\nChoose a main category:',
        Markup.keyboard(keyboard).resize().oneTime()
      )
      return
    }
    
    const selectedCategory = input
    
    if (!hierarchy[selectedCategory]) {
      await ctx.reply('Invalid category. Please choose from the options.')
      return
    }
    
    ctx.wizard.state.mainCategory = selectedCategory
    const subcategories = Object.keys(hierarchy[selectedCategory])
    const keyboard = createKeyboard(subcategories, true)
    
    await ctx.replyWithMarkdown(
      `🏃 *Log Activity - Step 2/5*\n\n*Category:* ${selectedCategory}\n\nChoose a subcategory:`,
      Markup.keyboard(keyboard).resize().oneTime()
    )
    
    return ctx.wizard.next()
  },
  
  // Step 2: Handle Subcategory selection and show Activity
  async (ctx: any) => {
    const input = ctx.message?.text
    
    if (input === '❌ Cancel') {
      await ctx.reply('Activity logging cancelled.', Markup.removeKeyboard())
      return ctx.scene.enter('registered_menu')
    }
    
    if (input === '⬅️ Back') {
      // Clean up state
      delete ctx.wizard.state.mainCategory
      
      const mainCategories = Object.keys(hierarchy)
      const keyboard = createKeyboard(mainCategories)
      
      await ctx.replyWithMarkdown(
        '🏃 *Log Activity - Step 1/5*\n\nChoose a main category:',
        Markup.keyboard(keyboard).resize().oneTime()
      )
      
      // Stay at current step, but will go to step 1 on next input
      return ctx.wizard.back()
    }
    
    const mainCat = ctx.wizard.state.mainCategory
    const selectedSubcategory = input
    
    if (!hierarchy[mainCat][selectedSubcategory]) {
      await ctx.reply('Invalid subcategory. Please choose from the options.')
      return
    }
    
    ctx.wizard.state.subcategory = selectedSubcategory
    const activities = Object.keys(hierarchy[mainCat][selectedSubcategory])
    const keyboard = createKeyboard(activities, true)
    
    await ctx.replyWithMarkdown(
      `🏃 *Log Activity - Step 3/5*\n\n*Subcategory:* ${selectedSubcategory}\n\nChoose specific activity:`,
      Markup.keyboard(keyboard).resize().oneTime()
    )
    
    return ctx.wizard.next()
  },
  
  // Step 3: Handle Activity selection and show Intensity
  async (ctx: any) => {
    const input = ctx.message?.text
    
    if (input === '❌ Cancel') {
      await ctx.reply('Activity logging cancelled.', Markup.removeKeyboard())
      return ctx.scene.enter('registered_menu')
    }
    
    if (input === '⬅️ Back') {
      // Clean up state
      delete ctx.wizard.state.subcategory
      
      const mainCat = ctx.wizard.state.mainCategory
      const subcategories = Object.keys(hierarchy[mainCat])
      const keyboard = createKeyboard(subcategories, true)
      
      await ctx.replyWithMarkdown(
        `🏃 *Log Activity - Step 2/5*\n\n*Category:* ${mainCat}\n\nChoose a subcategory:`,
        Markup.keyboard(keyboard).resize().oneTime()
      )
      
      return ctx.wizard.back()
    }
    
    const mainCat = ctx.wizard.state.mainCategory
    const subCat = ctx.wizard.state.subcategory
    const selectedActivity = input
    
    if (!hierarchy[mainCat][subCat][selectedActivity]) {
      await ctx.reply('Invalid activity. Please choose from the options.')
      return
    }
    
    ctx.wizard.state.activity = selectedActivity
    const intensities = Object.keys(hierarchy[mainCat][subCat][selectedActivity])
    
    // Add MET values to button labels
    const intensitiesWithMET = intensities.map(intensity => {
      const metValue = hierarchy[mainCat][subCat][selectedActivity][intensity][0].met_value
      return `${intensity} (${metValue} MET)`
    })
    
    const keyboard = createKeyboard(intensitiesWithMET, true)
    
    await ctx.replyWithMarkdown(
      `🏃 *Log Activity - Step 4/5*\n\n*Activity:* ${selectedActivity}\n\nChoose intensity:`,
      Markup.keyboard(keyboard).resize().oneTime()
    )
    
    return ctx.wizard.next()
  },
  
  // Step 4: Handle Intensity selection and show Duration
  async (ctx: any) => {
    const input = ctx.message?.text
    
    if (input === '❌ Cancel') {
      await ctx.reply('Activity logging cancelled.', Markup.removeKeyboard())
      return ctx.scene.enter('registered_menu')
    }
    
    if (input === '⬅️ Back') {
      // Clean up state
      delete ctx.wizard.state.activity
      
      const mainCat = ctx.wizard.state.mainCategory
      const subCat = ctx.wizard.state.subcategory
      const activities = Object.keys(hierarchy[mainCat][subCat])
      const keyboard = createKeyboard(activities, true)
      
      await ctx.replyWithMarkdown(
        `🏃 *Log Activity - Step 3/5*\n\n*Subcategory:* ${subCat}\n\nChoose specific activity:`,
        Markup.keyboard(keyboard).resize().oneTime()
      )
      
      return ctx.wizard.back()
    }
    
    // Extract intensity name from "Intensity (X MET)" format
    const intensityMatch = input?.match(/^(.+?)\s*\([\d.]+\s*MET\)$/)
    const selectedIntensity = intensityMatch ? intensityMatch[1] : input
    
    const mainCat = ctx.wizard.state.mainCategory
    const subCat = ctx.wizard.state.subcategory
    const activity = ctx.wizard.state.activity
    
    if (!hierarchy[mainCat][subCat][activity][selectedIntensity]) {
      await ctx.reply('Invalid intensity. Please choose from the options.')
      return
    }
    
    ctx.wizard.state.intensity = selectedIntensity
    ctx.wizard.state.metValue = hierarchy[mainCat][subCat][activity][selectedIntensity][0].met_value
    
    // Create inline keyboard with common duration options
    await ctx.replyWithMarkdown(
      `🏃 *Log Activity - Step 5/5*\n\n*Activity:* ${activity}\n*Intensity:* ${selectedIntensity}\n*MET Value:* ${ctx.wizard.state.metValue}\n\nHow many minutes did you exercise?\n\n_Tap a quick option below or type a custom number:_`,
      Markup.inlineKeyboard([
        [
          Markup.button.callback('15 min', 'duration:15'),
          Markup.button.callback('20 min', 'duration:20'),
          Markup.button.callback('30 min', 'duration:30')
        ],
        [
          Markup.button.callback('45 min', 'duration:45'),
          Markup.button.callback('60 min', 'duration:60'),
          Markup.button.callback('90 min', 'duration:90')
        ],
        [
          Markup.button.callback('120 min', 'duration:120'),
          Markup.button.callback('⬅️ Back', 'duration:back'),
          Markup.button.callback('❌ Cancel', 'duration:cancel')
        ]
      ])
    )
    
    return ctx.wizard.next()
  },
  
  // Step 5: Handle Duration and Save
  async (ctx: any) => {
    let minutes: number
    
    // Handle inline button callback
    if (ctx.callbackQuery?.data) {
      const data = ctx.callbackQuery.data
      
      if (data === 'duration:cancel') {
        await ctx.answerCbQuery()
        await ctx.reply('Activity logging cancelled.', Markup.removeKeyboard())
        return ctx.scene.enter('registered_menu')
      }
      
      if (data === 'duration:back') {
        await ctx.answerCbQuery()
        
        // Clean up state
        delete ctx.wizard.state.intensity
        delete ctx.wizard.state.metValue
        
        const mainCat = ctx.wizard.state.mainCategory
        const subCat = ctx.wizard.state.subcategory
        const activity = ctx.wizard.state.activity
        const intensities = Object.keys(hierarchy[mainCat][subCat][activity])
        
        const intensitiesWithMET = intensities.map(intensity => {
          const metValue = hierarchy[mainCat][subCat][activity][intensity][0].met_value
          return `${intensity} (${metValue} MET)`
        })
        
        const keyboard = createKeyboard(intensitiesWithMET, true)
        
        await ctx.replyWithMarkdown(
          `🏃 *Log Activity - Step 4/5*\n\n*Activity:* ${activity}\n\nChoose intensity:`,
          Markup.keyboard(keyboard).resize().oneTime()
        )
        
        return ctx.wizard.back()
      }
      
      if (data.startsWith('duration:')) {
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
        
        const mainCat = ctx.wizard.state.mainCategory
        const subCat = ctx.wizard.state.subcategory
        const activity = ctx.wizard.state.activity
        const intensities = Object.keys(hierarchy[mainCat][subCat][activity])
        
        const intensitiesWithMET = intensities.map(intensity => {
          const metValue = hierarchy[mainCat][subCat][activity][intensity][0].met_value
          return `${intensity} (${metValue} MET)`
        })
        
        const keyboard = createKeyboard(intensitiesWithMET, true)
        
        await ctx.replyWithMarkdown(
          `🏃 *Log Activity - Step 4/5*\n\n*Activity:* ${activity}\n\nChoose intensity:`,
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