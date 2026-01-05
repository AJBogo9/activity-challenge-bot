import { sql, initDb, closeDb } from '../src/db';

async function check() {
    await initDb();
    const uCount = await sql`SELECT COUNT(*) FROM user_daily_snapshots`;
    const gCount = await sql`SELECT COUNT(*) FROM guild_daily_snapshots`;
    const userCount = await sql`SELECT COUNT(*) FROM users`;
    const actCount = await sql`SELECT COUNT(*) FROM activities`;
    
    console.log(`Users: ${userCount[0].count}`);
    const act = actCount[0].count;
    console.log(`Activities: ${act}`);
    console.log(`User Snapshots: ${uCount[0].count}`);
    console.log(`Guild Snapshots: ${gCount[0].count}`);

    if (parseInt(act) > 1000) {
        console.log("⚠️ WARNING: Many activities detected. Fallback queries might be slow!");
    }

    await closeDb();
}
check();
