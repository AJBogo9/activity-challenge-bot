import { sql, closeDb } from '../src/db'
import { createUser } from '../src/db/users'
import { addPointsToUser } from '../src/db/point-queries'
import { VALID_GUILDS } from '../src/types'

async function populateData() {
  try {
    console.log("Connected to PostgreSQL for test data population.")

    // per guild
    const numberOfTeams = 9
    const MinUserCount = 75
    const MaxUserCount = 125

    for (const guild of VALID_GUILDS) {
      const numberOfUsers = Math.floor(Math.random() * (MaxUserCount - MinUserCount + 1)) + MinUserCount

      // Create users for this guild
      for (let j = 1; j <= numberOfUsers; j++) {
        const telegramId = `${guild}_${j}`
        const username = `testUser_${guild}_${j}`
        const firstName = `Test User ${guild} ${j}`
        
        // Check if user already exists
        const existingUser = await sql`
          SELECT * FROM users WHERE telegram_id = ${telegramId} LIMIT 1
        `
        
        let user
        if (existingUser.length > 0) {
          user = existingUser[0]
        } else {
          // Create user
          user = await createUser({
            telegramId: telegramId,
            username: username,
            firstName: firstName,
            guild: guild,
          })
        }

        // Award random points
        const randomPoints = Math.floor(Math.random() * 100) + 10 // 10-110 points
        
        try {
          await addPointsToUser(telegramId, randomPoints)
        } catch (error) {
          console.error(`Error awarding points to user ${telegramId}:`, error)
        }
      }

      // Log confirmation message when the whole guild is done
      console.log(`✓ Completed guild: ${guild} (${numberOfUsers} users, ${numberOfTeams} teams)`)
    }

    console.log("Test data population complete.")
    await closeDb()
    process.exit(0)
  } catch (error) {
    console.error("Error populating test data:", error)
    await closeDb()
    process.exit(1)
  }
}

populateData()