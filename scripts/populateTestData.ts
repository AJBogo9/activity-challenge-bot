import mongoose from 'mongoose'
import User from '../src/models/user-model'
import Team from '../src/models/team-model'
import { mongodbUri } from '../src/config/constants'
import * as pointService from '../src/services/point-service'
import * as teamService from '../src/services/team-service'
import * as userService from '../src/services/user-service'

async function populateData() {
    try {
        if (!mongodbUri) {
            throw new Error("MONGODB_URI is not defined")
        }
        await mongoose.connect(mongodbUri)
        console.log("Connected to MongoDB for test data population.")

        const validGuilds = (User as any).validGuilds
        // per guild
        const numberOfTeams = 9
        const MinUserCount = 75
        const MaxUserCount = 125

        for (const guild of validGuilds) {
            const numberOfUsers = Math.floor(Math.random() * (MaxUserCount - MinUserCount + 1)) + MinUserCount
            const teams = []
            for (let i = 1; i <= numberOfTeams; i++) {
                const teamName = `TestTeam_${guild}_${i}`
                let team = await Team.findOne({ name: teamName })
                if (!team) {
                    team = await teamService.createTeam(teamName, guild)
                    // console.log(`Created team ${teamName} for guild ${guild}`)
                }
                teams.push(team)
            }

            for (let j = 1; j <= numberOfUsers; j++) {
                const userId = `${guild}_${j}`
                let user = await User.findOne({ userId })
                if (!user) {
                    user = await userService.createUser({
                        userId: userId,
                        username: `testUser_${guild}_${j}`,
                        name: `Test User ${guild} ${j}`,
                        guild: guild,
                    })
                    const randomTeam = teams[Math.floor(Math.random() * teams.length)]
                    if (randomTeam) {
                        user.team = randomTeam._id
                        await user.save()
                        randomTeam.members.push(user._id)
                        await randomTeam.save()
                        // console.log(`Created user ${userId} in guild ${guild} and assigned to team ${randomTeam.name}`)
                    }
                }

                // Award random points for several events.
                const randomPoints: any = {
                    exercise: Math.floor(Math.random() * 50),
                    sportsTurn: Math.random() < 0.5 ? Math.random() < 0.5 ? 10 : 5 : 0,
                    trySport: Math.random() < 0.5 ? 5 : 0,
                    tryRecipe: Math.random() < 0.5 ? 5 : 0,
                    goodSleep: Math.random() < 0.5 ? 8 : 0,
                    meditate: Math.random() < 0.5 ? 5 : 0,
                    lessAlc: Math.random() < 0.5 ? 10 : 0,
                }
                randomPoints.total = Object.values(randomPoints).reduce((sum: any, num: any) => sum + num, 0)

                try {
                    if (user) {
                        await pointService.addPoints(user.userId, randomPoints)
                        // console.log(`Awarded random points to user ${user.userId}`)
                    }
                } catch (error) {
                    console.error(`Error awarding points to user ${userId}:`, error)
                }
            }

            // log confirmation message when the whole guild is done
            console.log(`✓ Completed guild: ${guild} (${numberOfUsers} users, ${numberOfTeams} teams)`)
        }
        console.log("Test data population complete.")
        process.exit(0)
    } catch (error) {
        console.error("Error populating test data:", error)
        process.exit(1)
    }
}

populateData()
