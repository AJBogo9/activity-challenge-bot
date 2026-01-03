// index.ts
import { bot } from './src/bot/instance'
import { startBot } from './src/bot/start'
import { closeDb } from './src/db'
import { startApiServer } from './src/api/server'

const BUILD_TIME = new Date().toLocaleString('en-GB', { 
  timeZone: 'Europe/Helsinki',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false
})

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
    console.log('✅ API server started\n')
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('✅ All services running')
    console.log(`📅 Build: ${BUILD_TIME}`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
    
    // Graceful shutdown handlers
    const shutdown = async (signal: string): Promise<void> => {
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log(`🛑 ${signal} received, shutting down gracefully...`)
      
      // Stop the bot
      bot.stop(signal)
      console.log('✅ Bot stopped')
      
      // Close database connections
      await closeDb()
      console.log('✅ Database closed')
      
      console.log('👋 Shutdown complete')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
      process.exit(0)
    }
    
    process.once('SIGINT', () => shutdown('SIGINT'))
    process.once('SIGTERM', () => shutdown('SIGTERM'))
  } catch (error) {
    console.error('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.error('❌ Failed to start application:', error)
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
    await closeDb()
    process.exit(1)
  }
}

main()