import mongoose from 'mongoose'
import User from '../src/models/user-model'
import Team from '../src/models/team-model'
import { mongodbUri } from '../src/config/constants'

async function clearDatabase() {
    try {
        // Connect to MongoDB
        if (!mongodbUri) {
            throw new Error("MONGODB_URI is not defined")
        }
        await mongoose.connect(mongodbUri)
        console.log('Connected to MongoDB')

        // Delete all test data
        const usersDeleted = await User.deleteMany({})
        const teamsDeleted = await Team.deleteMany({})

        console.log(`✓ Deleted ${usersDeleted.deletedCount} users`)
        console.log(`✓ Deleted ${teamsDeleted.deletedCount} teams`)

        console.log('\nDatabase cleared successfully!')

        await mongoose.disconnect()
        console.log('Disconnected from MongoDB')
        process.exit(0)
    } catch (error) {
        console.error('Error clearing database:', error)
        process.exit(1)
    }
}

clearDatabase()
