import { sql, closeDb } from '../src/db'
import { createUser } from '../src/db/users'
import { createTeam, updateTeamPoints } from '../src/db/teams'
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
      const teams = []

      // Create teams for this guild
      for (let i = 1; i <= numberOfTeams; i++) {
        const teamName = `TestTeam_${guild}_${i}`
        
        // Check if team already exists
        const existingTeam = await sql`
          SELECT * FROM teams WHERE name = ${teamName} LIMIT 1
        `
        
        let team
        if (existingTeam.length > 0) {
          team = existingTeam[0]
        } else {
          team = await createTeam(teamName, guild)
        }
        teams.push(team)
      }

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

          // Assign to random team
          const randomTeam = teams[Math.floor(Math.random() * teams.length)]
          if (randomTeam) {
            await sql`
              UPDATE users 
              SET team_id = ${randomTeam.id}
              WHERE telegram_id = ${telegramId}
            `
          }
        }

        // Award random points
        const randomPoints = Math.floor(Math.random() * 100) + 10 // 10-110 points
        
        try {
          await addPointsToUser(telegramId, randomPoints)
        } catch (error) {
          console.error(`Error awarding points to user ${telegramId}:`, error)
        }
      }

      // Update all team points for this guild
      for (const team of teams) {
        await updateTeamPoints(team.id)
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