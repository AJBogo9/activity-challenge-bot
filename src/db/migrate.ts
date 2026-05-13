import { sql } from './index'
import { readFileSync } from 'fs'
import { join } from 'path'
import { GUILDS } from '../config/guilds'

export async function runMigrations() {
  try {
    console.log('🔄 Running database migrations...')
    
    // Suppress NOTICE messages for cleaner output
    await sql`SET client_min_messages TO WARNING;`
    
    const schemaSQL = readFileSync(join(__dirname, 'schema.sql'), 'utf-8')
    await sql.unsafe(schemaSQL)
    
    // Reset back to default
    await sql`SET client_min_messages TO NOTICE;`
    
    console.log('✅ Database migrations completed')
  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  }
}

export async function seedGuilds() {
  for (const guild of GUILDS) {
    await sql`
      INSERT INTO guilds (name, total_members, is_active)
      VALUES (${guild.name}, ${guild.totalMembers}, ${guild.isActive})
      ON CONFLICT (name) DO UPDATE
      SET total_members = EXCLUDED.total_members,
          is_active = EXCLUDED.is_active
    `
  }
}

// Actually run the migration when this file is executed
if (import.meta.main) {
  runMigrations()
    .then(() => {
      console.log('✨ Migration complete')
      process.exit(0)
    })
    .catch((error) => {
      console.error('Migration failed:', error)
      process.exit(1)
    })
}