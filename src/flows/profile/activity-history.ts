import { Scenes, Markup } from 'telegraf'
import { findUserByTelegramId, getActivitiesByUser, deleteActivity, addPointsToUser } from '../../db'
import { TwoMessageManager } from '../../utils'
import { Activity } from '../../types'

const ACTIVITIES_PER_PAGE = 5

export const activityHistoryScene = new Scenes.BaseScene<any>('activity_history')

/**
 * Helper to build activity history message with pagination
 */
function buildActivityMessage(
  activities: Activity[],
  page: number,
  totalPages: number
): { text: string; keyboard: any } {
  const startIdx = page * ACTIVITIES_PER_PAGE
  const endIdx = Math.min(startIdx + ACTIVITIES_PER_PAGE, activities.length)
  const pageActivities = activities.slice(startIdx, endIdx)

  let message = '📜 *Activity History*\n\n'

  if (pageActivities.length === 0) {
    message += "You haven't logged any activities yet."
    return {
      text: message,
      keyboard: null
    }
  }

  // Build activity list with delete buttons
  const buttons: any[] = []
  
  pageActivities.forEach((activity, index) => {
    const globalIndex = startIdx + index + 1
    message += `*${globalIndex}.* ${activity.activity_type}\n`
    
    if (activity.duration) {
      message += `   ⏱️ Duration: ${activity.duration} min\n`
    }
    message += `   🎯 Points: ${activity.points}\n`
    
    if (activity.description) {
      message += `   📝 ${activity.description}\n`
    }
    message += `   📅 ${activity.activity_date}\n`

    // Add delete button for this activity
    buttons.push([
      Markup.button.callback(`🗑️ Delete #${globalIndex}`, `delete:${activity.id}`)
    ])
    
    message += '\n'
  })

  message += `_Page ${page + 1} of ${totalPages} • Total activities: ${activities.length}_`

  // Add pagination buttons if needed
  const paginationButtons: any[] = []
  if (page > 0) {
    paginationButtons.push(Markup.button.callback('◀️ Previous', `page:${page - 1}`))
  }
  if (page < totalPages - 1) {
    paginationButtons.push(Markup.button.callback('Next ▶️', `page:${page + 1}`))
  }
  
  if (paginationButtons.length > 0) {
    buttons.push(paginationButtons)
  }

  const keyboard = Markup.inlineKeyboard(buttons)

  return { text: message, keyboard }
}

/**
 * Helper to display activity history for a given page
 */
async function displayActivityHistory(ctx: any, page: number = 0) {
  try {
    const user = await findUserByTelegramId(ctx.from.id.toString())
    if (!user) {
      await TwoMessageManager.updateContent(
        ctx,
        'User not found. Please register first.'
      )
      await ctx.scene.enter('registered_menu')
      return
    }

    const activities = await getActivitiesByUser(user.id)

    // Store activities and current page in session for deletion flow
    ctx.session.activityHistory = {
      activities,
      currentPage: page
    }

    if (activities.length === 0) {
      const message = '📜 *Activity History*\n\nYou haven\'t logged any activities yet.'
      await TwoMessageManager.updateContent(ctx, message)
      return
    }

    const totalPages = Math.ceil(activities.length / ACTIVITIES_PER_PAGE)
    const { text, keyboard } = buildActivityMessage(activities, page, totalPages)

    await TwoMessageManager.updateContent(ctx, text, keyboard)
  } catch (error) {
    console.error('Error fetching activity history:', error)
    await TwoMessageManager.updateContent(
      ctx,
      '❌ An error occurred while fetching your activity history.'
    )
  }
}

// Scene entry point
activityHistoryScene.enter(async (ctx: any) => {
  await displayActivityHistory(ctx, 0)
  
  if (ctx.callbackQuery) {
    await ctx.answerCbQuery()
  }
})

// Handle pagination
activityHistoryScene.action(/^page:(\d+)$/, async (ctx: any) => {
  const page = parseInt(ctx.match[1])
  await displayActivityHistory(ctx, page)
  await ctx.answerCbQuery()
})

// Handle delete button - show confirmation
activityHistoryScene.action(/^delete:(\d+)$/, async (ctx: any) => {
  const activityId = parseInt(ctx.match[1])
  
  // Find the activity to show details in confirmation
  const activities = ctx.session.activityHistory?.activities || []
  const activity = activities.find((a: Activity) => a.id === activityId)
  
  if (!activity) {
    await ctx.answerCbQuery('❌ Activity not found')
    return
  }

  // Build confirmation message
  let message = '⚠️ *Delete Activity?*\n\n'
  message += `*${activity.activity_type}*\n`
  
  if (activity.duration) {
    message += `⏱️ ${activity.duration} min | `
  }
  message += `🎯 ${activity.points} pts\n`
  message += `📅 ${activity.activity_date}\n\n`
  message += `This will deduct *${activity.points} points* from your total.\n\n`
  message += '_Are you sure you want to delete this activity?_'

  const keyboard = Markup.inlineKeyboard([
    [
      Markup.button.callback('✅ Confirm Delete', `confirm_delete:${activityId}`),
      Markup.button.callback('❌ Cancel', 'cancel_delete')
    ]
  ])

  await TwoMessageManager.updateContent(ctx, message, keyboard)
  await ctx.answerCbQuery()
})

// Handle confirmed deletion
activityHistoryScene.action(/^confirm_delete:(\d+)$/, async (ctx: any) => {
  const activityId = parseInt(ctx.match[1])
  
  try {
    // Find the activity to get points value
    const activities = ctx.session.activityHistory?.activities || []
    const activity = activities.find((a: Activity) => a.id === activityId)
    
    if (!activity) {
      await ctx.answerCbQuery('❌ Activity not found')
      return
    }

    const user = await findUserByTelegramId(ctx.from.id.toString())
    if (!user) {
      await ctx.answerCbQuery('❌ User not found')
      return
    }

    // Delete the activity from database
    await deleteActivity(activityId)

    // Deduct points from user (use negative value)
    await addPointsToUser(user.id, -activity.points)

    // Show success message in callback
    await ctx.answerCbQuery(`✅ Activity deleted! -${activity.points} points`, { show_alert: false })

    // Refresh the activity history, maintaining current page if possible
    const currentPage = ctx.session.activityHistory?.currentPage || 0
    await displayActivityHistory(ctx, currentPage)
  } catch (error) {
    console.error('Error deleting activity:', error)
    await ctx.answerCbQuery('❌ Failed to delete activity', { show_alert: true })
  }
})

// Handle cancel deletion
activityHistoryScene.action('cancel_delete', async (ctx: any) => {
  await ctx.answerCbQuery('Deletion cancelled')
  
  // Return to activity history at the same page
  const currentPage = ctx.session.activityHistory?.currentPage || 0
  await displayActivityHistory(ctx, currentPage)
})

// Handle reply keyboard navigation
activityHistoryScene.on('text', async (ctx: any) => {
  const handled = await TwoMessageManager.handleNavigation(ctx, ctx.message.text)
  if (!handled) {
    // If not a navigation button, just delete the message
    await TwoMessageManager.deleteUserMessage(ctx)
  }
})