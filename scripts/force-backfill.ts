import { sql, initDb, closeDb, takeDailySnapshot } from '../src/db';

async function forceBackfill() {
    await initDb();
    console.log('🔄 Starting forced backfill for last 30 days...');

    for (let i = 30; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        console.log(`⏳ Backfilling ${dateStr}...`);
        
        await sql.begin(async (sql) => {
            // User snapshots for this date
            await sql`
              INSERT INTO user_daily_snapshots (date, telegram_id, points, rank)
              SELECT ${dateStr}::DATE, u.telegram_id, COALESCE(SUM(a.points), 0), RANK() OVER (ORDER BY COALESCE(SUM(a.points), 0) DESC)
              FROM users u 
              LEFT JOIN activities a ON u.id = a.user_id AND a.activity_date <= ${dateStr}::DATE
              GROUP BY u.telegram_id
              ON CONFLICT (date, telegram_id) DO UPDATE SET points = EXCLUDED.points, rank = EXCLUDED.rank
            `;
            // Guild snapshots for this date
            await sql`
              INSERT INTO guild_daily_snapshots (date, guild_name, points, rank)
              SELECT ${dateStr}::DATE, g.name, 
                     COALESCE(SUM(a.points), 0) / NULLIF(CAST(g.total_members AS DECIMAL), 0), 
                     RANK() OVER (ORDER BY COALESCE(SUM(a.points), 0) / NULLIF(CAST(g.total_members AS DECIMAL), 0) DESC)
              FROM guilds g 
              LEFT JOIN users u ON g.name = u.guild
              LEFT JOIN activities a ON u.id = a.user_id AND a.activity_date <= ${dateStr}::DATE
              WHERE g.is_active = TRUE 
              GROUP BY g.name, g.total_members
              ON CONFLICT (date, guild_name) DO UPDATE SET points = EXCLUDED.points, rank = EXCLUDED.rank
            `;
        });
    }

    console.log('✅ Forced backfill complete.');
    await closeDb();
}

forceBackfill();
