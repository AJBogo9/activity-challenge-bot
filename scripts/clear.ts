import { sql, closeDb } from '../src/db'

async function clearDatabase() {
  try {
    console.log('Connected to PostgreSQL')
    
    // Delete all data (order matters due to foreign keys)
    const activities = await sql`DELETE FROM activities`
    const users = await sql`DELETE FROM users`
    const guilds = await sql`DELETE FROM guilds`
    
    console.log(`✓ Deleted ${activities.count} activities`)
    console.log(`✓ Deleted ${users.count} users`)
    console.log(`✓ Deleted ${guilds.count} guilds`)
    
    console.log('\nDatabase cleared successfully!')
    
    await closeDb()
    console.log('Disconnected from PostgreSQL')
    process.exit(0)
  } catch (error) {
    console.error('Error clearing database:', error)
    await closeDb()
    process.exit(1)
  }
}

clearDatabase()