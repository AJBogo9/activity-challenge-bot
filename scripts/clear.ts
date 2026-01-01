import { sql, closeDb } from '../src/db'

async function clearDatabase() {
  try {
    console.log("Connected to PostgreSQL")

    console.log("Clearing all tables...")
    // Using DELETE instead of TRUNCATE for more reliable behavior across different environments
    // The order matters because of foreign key constraints
    await sql.unsafe('DELETE FROM activities')
    await sql.unsafe('DELETE FROM feedback')
    await sql.unsafe('DELETE FROM users')
    await sql.unsafe('DELETE FROM guilds')

    console.log("Database cleared successfully (all tables)!")
    await closeDb()
    process.exit(0)
  } catch (error) {
    console.error("Error clearing database:", error)
    await closeDb()
    process.exit(1)
  }
}

clearDatabase()