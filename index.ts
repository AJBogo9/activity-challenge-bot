// index.ts
import { startBot } from './src/bot/start'
import { closeDb } from './src/db'
import * as flows from './src/flows'
import { registerGlobalHandlers } from './src/bot/handlers/handlers'
import { TwoMessageManager } from './src/utils/two-message-manager'
import { startApiServer } from './src/api/server'

/**
 * Main entry point
 */
async function main(): Promise<void> {
  try {
    // Start the bot
    await startBot()
    
    // Start API Server
    const API_PORT = parseInt(process.env.API_PORT || '3000')
    console.log(`🌐 Starting API server on port ${API_PORT}...`)
    startApiServer(API_PORT)
    
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
      console.log('👋 Shutdown complete\n')
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

main()