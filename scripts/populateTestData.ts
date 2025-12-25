import { sql, closeDb } from '../src/db'
import { createUser } from '../src/db/users'
import { addPointsToUser } from '../src/db/point-queries'
import { VALID_GUILDS } from '../src/types'

async function populateData() {
  try {
    console.log("Connected to PostgreSQL for test data population.")
    
    // per guild
    const MinUserCount = 75
    const MaxUserCount = 125
    
    const activityTypes = ['running', 'cycling', 'swimming', 'gym', 'walking', 'yoga', 'hiking']
    
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
        
        // Create random activities for this user
        const numberOfActivities = Math.floor(Math.random() * 5) + 1 // 1-5 activities per user
        let totalPoints = 0
        
        for (let k = 0; k < numberOfActivities; k++) {
          const activityType = activityTypes[Math.floor(Math.random() * activityTypes.length)]
          const duration = Math.floor(Math.random() * 90) + 15 // 15-105 minutes
          const activityPoints = parseFloat((Math.random() * 20 + 5).toFixed(2)) // 5-25 points
          const daysAgo = Math.floor(Math.random() * 30) // 0-30 days ago
          
          await sql`
            INSERT INTO activities (user_id, activity_type, duration, points, description, activity_date)
            VALUES (
              ${user.id},
              ${activityType},
              ${duration},
              ${activityPoints},
              ${`Test activity: ${activityType} for ${duration} minutes`},
              CURRENT_DATE - ${daysAgo}
            )
          `
          
          totalPoints += activityPoints
        }
        
        // Award the total points from activities to the user
        try {
          await addPointsToUser(telegramId, totalPoints)
        } catch (error) {
          console.error(`Error awarding points to user ${telegramId}:`, error)
        }
      }
      
      // Log confirmation message when the whole guild is done
      console.log(`✓ Completed guild: ${guild} (${numberOfUsers} users)`)
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