import { sql } from './index'
import { readFileSync } from 'fs'
import { join } from 'path'

export async function runMigrations() {
  try {
    console.log('🔄 Creating database tables...')
    
    const schemaSQL = readFileSync(join(__dirname, 'schema.sql'), 'utf-8')
    await sql.unsafe(schemaSQL)
    
    console.log('✅ Tables created successfully')
  } catch (error) {
    console.error('❌ Failed to create tables:', error)
    throw error
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