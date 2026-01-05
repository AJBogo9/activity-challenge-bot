import { bot } from './instance'
import { registerMiddleware } from './middleware'
import { registerCommands } from './commands'
import { registerGlobalHandlers } from './handlers/handlers'
import { setupBotCommands } from './setup'
import { initDb, runMigrations, takeDailySnapshot, sql } from '../db'

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

  // Step 2.5: Auto-backfill snapshots if empty
  try {
    const snapshots = await sql`SELECT COUNT(*) FROM user_daily_snapshots`;
    if (snapshots[0].count === '0') {
      console.log('🔄 Snapshot history is empty. Performing automatic backfill...');
      // Logic for historical snapshots
      for (let i = 30; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        await sql.begin(async (sql) => {
          await sql`
            INSERT INTO user_daily_snapshots (date, telegram_id, points, rank)
            SELECT ${dateStr}::DATE, u.telegram_id, COALESCE(SUM(a.points), 0), RANK() OVER (ORDER BY COALESCE(SUM(a.points), 0) DESC)
            FROM users u LEFT JOIN activities a ON u.id = a.user_id AND a.activity_date <= ${dateStr}::DATE
            GROUP BY u.telegram_id ON CONFLICT DO NOTHING
          `;
          await sql`
            INSERT INTO guild_daily_snapshots (date, guild_name, points, rank)
            SELECT ${dateStr}::DATE, g.name, COALESCE(SUM(a.points), 0) / CAST(g.total_members AS DECIMAL), 
                   RANK() OVER (ORDER BY COALESCE(SUM(a.points), 0) / CAST(g.total_members AS DECIMAL) DESC)
            FROM guilds g LEFT JOIN users u ON g.name = u.guild
            LEFT JOIN activities a ON u.id = a.user_id AND a.activity_date <= ${dateStr}::DATE
            WHERE g.is_active = TRUE GROUP BY g.name, g.total_members ON CONFLICT DO NOTHING
          `;
        });
      }
      console.log('✅ Automatic backfill complete\n');
    } else {
      // Just take today's snapshot
      await takeDailySnapshot();
    }

    // Set up recurring snapshot every 60 seconds
    setInterval(async () => {
      try {
        await takeDailySnapshot();
      } catch (err) {
        console.error('❌ Background snapshot failed:', (err as Error).message);
      }
    }, 60000);

  } catch (e) {
    console.warn('⚠️ Snapshot automation failed, but continuing bot startup:', (e as Error).message);
  }

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