import { Scenes, Markup } from 'telegraf'
import { findUserByTelegramId, deleteUser } from '../../db/users'
import { getActivitiesByUser, deleteActivity } from '../../db/activities'

export const profileScene = new Scenes.BaseScene<any>('profile')

// Helper function to show profile menu
async function showProfileMenu(ctx: any) {
  await ctx.replyWithMarkdown(
    '👤 *Profile*\n\nWhat would you like to view?',
    Markup.keyboard([
      ['📊 User Summary', '📜 Activity History'],
      ['🗑️ Delete Account'],
      ['⬅️ Back to Main Menu']
    ])
    .resize()
    .persistent()
  )
}

profileScene.enter(async (ctx: any) => {
  await showProfileMenu(ctx)
})

// Handle User Summary
profileScene.hears('📊 User Summary', async (ctx: any) => {
  try {
    const user = await findUserByTelegramId(ctx.from.id.toString())
    
    if (!user) {
      await ctx.reply('User not found. Please register first.')
      return ctx.scene.enter('registered_menu')
    }

    const registeredDate = new Date(user.created_at).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })

    const summary = `
📊 *User Summary*

👤 *Name:* ${user.first_name}${user.last_name ? ' ' + user.last_name : ''}
🆔 *Username:* ${user.username ? '@' + user.username : 'N/A'}
🏛️ *Guild:* ${user.guild || 'None'}
🎯 *Total Points:* ${user.points || 0}
📅 *Registered:* ${registeredDate}
✅ *Status:* ${user.is_active ? 'Active' : 'Inactive'}
`

    await ctx.replyWithMarkdown(summary)
    await showProfileMenu(ctx)
  } catch (error) {
    console.error('Error fetching user summary:', error)
    await ctx.reply('An error occurred while fetching your profile.')
    await showProfileMenu(ctx)
  }
})

// Handle Activity History
profileScene.hears('📜 Activity History', async (ctx: any) => {
  try {
    const user = await findUserByTelegramId(ctx.from.id.toString())
    
    if (!user) {
      await ctx.reply('User not found. Please register first.')
      return ctx.scene.enter('registered_menu')
    }

    const activities = await getActivitiesByUser(user.id)
    
    if (activities.length === 0) {
      await ctx.reply('📜 You haven\'t logged any activities yet.')
      await showProfileMenu(ctx)
      return
    }

    // Reverse array to show oldest first, newest at bottom
    const sortedActivities = [...activities].reverse()

    let message = '📜 *Activity History*\n\n'
    
    sortedActivities.forEach((activity, index) => {
      const date = new Date(activity.created_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
      
      const time = new Date(activity.created_at).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      })

      message += `*${index + 1}.* ${activity.activity_type}\n`
      
      if (activity.duration) {
        message += `   ⏱️ Duration: ${activity.duration} min\n`
      }
      
      message += `   🎯 Points: ${activity.points}\n`
      
      if (activity.description) {
        message += `   📝 ${activity.description}\n`
      }
      
      message += `   📅 ${activity.activity_date}\n\n`
    })

    message += `_Total activities: ${activities.length}_`

    // Telegram has a message length limit of ~4096 characters
    // If message is too long, split it
    if (message.length > 4000) {
      const chunks: string[] = []
      let currentChunk = '📜 *Activity History*\n\n'
      
      sortedActivities.forEach((activity, index) => {
        const date = new Date(activity.created_at).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        })
        
        const time = new Date(activity.created_at).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit'
        })

        let activityText = `*${index + 1}.* ${activity.activity_type}\n`
        
        if (activity.duration) {
          activityText += `   ⏱️ Duration: ${activity.duration} min\n`
        }
        
        activityText += `   🎯 Points: ${activity.points}\n`
        
        if (activity.description) {
          activityText += `   📝 ${activity.description}\n`
        }
        
        activityText += `   📅 ${date}\n\n`

        if (currentChunk.length + activityText.length > 4000) {
          chunks.push(currentChunk)
          currentChunk = activityText
        } else {
          currentChunk += activityText
        }
      })
      
      if (currentChunk) {
        chunks.push(currentChunk + `_Total activities: ${activities.length}_`)
      }

      for (const chunk of chunks) {
        await ctx.replyWithMarkdown(chunk)
      }
    } else {
      await ctx.replyWithMarkdown(message)
    }

    await showProfileMenu(ctx)
  } catch (error) {
    console.error('Error fetching activity history:', error)
    await ctx.reply('An error occurred while fetching your activity history.')
    await showProfileMenu(ctx)
  }
})

// Handle Delete Account - First confirmation
profileScene.hears('🗑️ Delete Account', async (ctx: any) => {
  const keyboard = Markup.inlineKeyboard([
    [
      Markup.button.callback('✅ Yes, delete my account', 'confirm_delete'),
      Markup.button.callback('❌ Cancel', 'cancel_delete')
    ]
  ])

  await ctx.replyWithMarkdown(
    '⚠️ *Delete Account*\n\n' +
    'Are you sure you want to delete your account?\n\n' +
    '**This action cannot be undone!**\n\n' +
    'This will permanently delete:\n' +
    '• Your profile and all data\n' +
    '• All your logged activities\n' +
    '• Your points and team membership',
    keyboard
  )
})

// Handle Delete Confirmation
profileScene.action('confirm_delete', async (ctx: any) => {
  await ctx.answerCbQuery()
  
  try {
    const user = await findUserByTelegramId(ctx.from.id.toString())
    
    if (!user) {
      await ctx.reply('User not found.')
      return ctx.scene.enter('start_wizard')
    }

    // Delete all user activities first
    const activities = await getActivitiesByUser(user.id)
    for (const activity of activities) {
      await deleteActivity(activity.id)
    }

    // Delete the user
    await deleteUser(ctx.from.id.toString())

    await ctx.replyWithMarkdown(
      '✅ *Account Deleted*\n\n' +
      'Your account and all associated data have been permanently deleted.\n\n' +
      'Thank you for using our bot. You can register again anytime with /start'
    )

    return ctx.scene.enter('main_menu')
  } catch (error) {
    console.error('Error deleting account:', error)
    await ctx.reply('An error occurred while deleting your account. Please try again later.')
    await showProfileMenu(ctx)
  }
})

// Handle Cancel Delete
profileScene.action('cancel_delete', async (ctx: any) => {
  await ctx.answerCbQuery()
  await ctx.reply('Account deletion cancelled.')
  await showProfileMenu(ctx)
})

// Handle Back to Main Menu
profileScene.hears('⬅️ Back to Main Menu', async (ctx: any) => {
  return ctx.scene.enter('registered_menu')
})

// Fallback for any other text input - keep this at the end
profileScene.on('text', async (ctx: any) => {
  await ctx.reply('Please use the buttons below to navigate.')
  await showProfileMenu(ctx)
})