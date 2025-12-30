import { Scenes, session } from 'telegraf'
import { bot } from './src/bot/instance'
import { registerCommands } from './src/bot/commands'
import { runMigrations } from './src/db/migrate'
import { setupBotCommands } from './src/bot/setup'
import { closeDb } from './src/db'
import * as flows from './src/flows'
import { registerGlobalHandlers } from './src/bot/handlers/handlers'

type MyContext = Scenes.SceneContext

// Build timestamp
const BUILD_TIME = new Date().toISOString()

// Setup scenes stage
const stage = new Scenes.Stage<MyContext>(Object.values(flows) as any[])

// Register middleware IN ORDER
bot.use(session())
bot.use(stage.middleware())

// Global navigation middleware - AFTER stage middleware so ctx.scene exists
bot.use(async (ctx, next) => {
  if (ctx.message && 'text' in ctx.message) {
    const text = ctx.message.text
    
    // Map of reply keyboard buttons to their target scenes
    const navigationMap: Record<string, string> = {
      '📝 Register': 'register_wizard',
      'ℹ️ Info': 'info_menu',
      '👤 Profile': 'profile',
      '💪 Log Activity': 'sports_activity_wizard',
      '📊 Statistics': 'stats_menu',
      '💬 Feedback': 'feedback_wizard'
    }
    
    // Check if this is a navigation button
    if (navigationMap[text]) {
      // Delete the user's message to keep chat clean
      try {
        await ctx.deleteMessage()
      } catch (error) {
        // Silently ignore if deletion fails
      }
      
      // Navigate to the target scene
      return ctx.scene.enter(navigationMap[text])
    }
  }
  
  return next()
})

// Register global handlers AFTER stage middleware
// This way ctx.wizard will exist when callbacks are processed
registerGlobalHandlers()

// Register commands
registerCommands()

// Main startup function
async function main() {
  try {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('🚀 Starting Activity Challenge Bot...')
    console.log(`📅 Build: ${BUILD_TIME}`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    // Setup database (create tables)
    console.log('📊 Setting up database...')
    await runMigrations()
    console.log('')

    // Setup bot commands menu
    console.log('⚙️  Configuring bot commands...')
    await setupBotCommands()
    console.log('')

    // Start the bot
    console.log('🤖 Launching bot...')
    bot.launch()

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('✅ Bot is now running and listening for messages')
    console.log(`📅 Build: ${BUILD_TIME}`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    // Graceful shutdown handlers
    const shutdown = async (signal: string) => {
      console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
      console.log(`${signal} received, shutting down gracefully...`)
      bot.stop(signal)
      await closeDb()
      console.log('👋 Shutdown complete')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
      process.exit(0)
    }

    process.once('SIGINT', () => shutdown('SIGINT'))
    process.once('SIGTERM', () => shutdown('SIGTERM'))
  } catch (error) {
    console.error('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.error('❌ Failed to start bot:', error)
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
    await closeDb()
    process.exit(1)
  }
}

// Start the application
main()