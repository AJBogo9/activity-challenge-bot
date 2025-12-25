import { sql, closeDb } from '../src/db'

async function clearDatabase() {
  try {
    console.log("Connected to PostgreSQL")

    // Clear all data from tables (in correct order due to foreign keys)
    await sql`TRUNCATE TABLE activities CASCADE`
    await sql`TRUNCATE TABLE users CASCADE`

    console.log("Database cleared successfully!")
    await closeDb()
    process.exit(0)
  } catch (error) {
    console.error("Error clearing database:", error)
    await closeDb()
    process.exit(1)
  }
}

clearDatabase()