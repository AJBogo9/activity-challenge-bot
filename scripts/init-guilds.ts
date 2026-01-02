import { sql, initDb, closeDb } from '../src/db'

const INITIAL_GUILDS = [
    { name: 'TiK', members: 300 },
    { name: 'DG', members: 250 },
    { name: 'FK', members: 400 },
    { name: 'PT', members: 350 },
    { name: 'AS', members: 200 },
    { name: 'SIK', members: 450 },
    { name: 'KIK', members: 300 },
    { name: 'MK', members: 150 },
    { name: 'IK', members: 200 },
    { name: 'Athene', members: 180 },
    { name: 'Prodeko', members: 220 },
    { name: 'Inkubio', members: 160 },
    { name: 'KY', members: 800 },
    { name: 'TOKYO', members: 300 },
    { name: 'AK', members: 200 },
    { name: 'TF', members: 250 },
    { name: 'PJK', members: 100 },
    { name: 'VK', members: 120 },
    { name: 'KK', members: 150 }
]

async function initGuilds() {
    try {
        await initDb()
        console.log('Initializing guilds...')

        for (const guild of INITIAL_GUILDS) {
            await sql`
        INSERT INTO guilds (name, total_members)
        VALUES (${guild.name}, ${guild.members})
        ON CONFLICT (name) DO UPDATE 
        SET total_members = EXCLUDED.total_members
      `
            console.log(`✓ Initialized ${guild.name} with ${guild.members} members`)
        }

        console.log('Guild initialization complete.')
        await closeDb()
        process.exit(0)
    } catch (error) {
        console.error('Error initializing guilds:', error)
        await closeDb()
        process.exit(1)
    }
}

initGuilds()
