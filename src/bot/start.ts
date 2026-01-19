import { bot } from './instance'
import { registerMiddleware } from './middleware'
import { registerCommands } from './commands'
import { registerGlobalHandlers } from './handlers/handlers'
import { setupBotCommands } from './setup'
import { initDb, runMigrations } from '../db'

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
 * Initialize and start the Telegram bot
 */
export async function startBot(): Promise<void> {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('🚀 Starting Activity Challenge Bot...')
  console.log(`📅 Build: ${BUILD_TIME}`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  // Step 1: Connect to database
  console.log('📊 Connecting to database...')
  await initDb()
  console.log('✅ Database connected\n')

  // Step 2: Run migrations
  console.log('📊 Running migrations...')
  await runMigrations()
  console.log('✅ Migrations complete\n')

  // Step 3: Register middleware (order matters!)
  console.log('⚙️  Registering middleware...')
  registerMiddleware(bot)
  console.log('✅ Middleware registered\n')

  // Step 4: Register handlers and commands
  console.log('🎮 Registering handlers...')
  registerGlobalHandlers()
  registerCommands()
  console.log('✅ Handlers registered\n')

  // Step 5: Setup bot commands menu
  console.log('📋 Configuring bot commands...')
  await setupBotCommands()
  console.log('✅ Commands configured\n')

  // Step 6: Launch bot
  console.log('🤖 Launching bot...')
  bot.launch()

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('✅ Bot is running and ready!')
  console.log(`📅 Build: ${BUILD_TIME}`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
}