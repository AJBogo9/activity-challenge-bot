import { Scenes, session } from 'telegraf'
import { bot } from './src/bot/instance'
import { registerCommands } from './src/bot/commands'
import { runMigrations } from './src/db/migrate'
import { setupBotCommands } from './src/bot/setup'
import { closeDb } from './src/db'
import * as flows from './src/flows'
import { registerGlobalHandlers } from './src/bot/handlers/handlers'

type MyContext = Scenes.SceneContext

// Setup scenes stage
const stage = new Scenes.Stage<MyContext>(Object.values(flows) as any[])

// Register middleware
bot.use(session())
bot.use(stage.middleware())

// Register all handlers
registerCommands()
registerGlobalHandlers()

// Main startup function
async function main() {
  try {
    console.log('🚀 Starting Summer Body Bot...')

    // Setup database (create tables)
    console.log('📊 Setting up database...')
    await runMigrations()

    // Setup bot commands menu
    console.log('⚙️  Configuring bot commands...')
    await setupBotCommands()

    // Start the bot
    console.log('🤖 Launching bot...')
    await bot.launch()
    console.log('✅ Bot started successfully!')

    // Graceful shutdown handlers
    const shutdown = async (signal: string) => {
      console.log(`\n${signal} received, shutting down gracefully...`)
      bot.stop(signal)
      await closeDb()
      console.log('👋 Shutdown complete')
      process.exit(0)
    }

    process.once('SIGINT', () => shutdown('SIGINT'))
    process.once('SIGTERM', () => shutdown('SIGTERM'))
  } catch (error) {
    console.error('❌ Failed to start bot:', error)
    await closeDb()
    process.exit(1)
  }
}

// Start the application
main()