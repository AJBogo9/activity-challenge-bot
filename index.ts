// index.ts
import { startBot } from './src/bot/start'
import { closeDb } from './src/db'

/**
 * Main entry point
 */
async function main(): Promise<void> {
  try {
    // Start the bot
    await startBot()

    // Setup graceful shutdown
    const shutdown = async (signal: string): Promise<void> => {
      console.log(`\n🛑 ${signal} received, shutting down gracefully...`)
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