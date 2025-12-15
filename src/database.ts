import mongoose from 'mongoose'
import { mongodbUri } from './config'

export const connectDatabase = async () => {
  try {
    if (!mongodbUri) {
      throw new Error("MONGODB_URI is not defined in environment variables")
    }
    await mongoose.connect(mongodbUri)
    console.log('MongoDB connected')
  } catch (error) {
    console.error('MongoDB connection error:', error)
    process.exit(1)
  }
}

export const disconnectDatabase = async () => {
  try {
    await mongoose.disconnect()
    console.log('MongoDB disconnected')
  } catch (error) {
    console.error('MongoDB disconnection error:', error)
    process.exit(1)
  }
}
