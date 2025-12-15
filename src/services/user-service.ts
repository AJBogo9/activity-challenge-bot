import User from '../models/user-model'
import { reminderMessage } from '../config/constants'

export const createUser = async (userData: any) => {
  try {
    const user = new User(userData)
    await user.save()
    return user
  } catch (error) {
    console.error('Error occurred in createUser: ', error)
    throw new Error('Error creating user')
  }
}

export const findUser = async (userId: string) => {
  try {
    const user = await User.findOne({ userId: userId })
    return user
  } catch (error) {
    console.error('Error occurred in findUser: ', error)
    throw new Error('Error finding user')
  }
}

export const getAllUsers = async () => {
  try {
    const users = await User.find({})
    return users
  } catch (error) {
    console.error('Error occurred in getAllUsers:', error)
    return []
  }
}

export const deleteUser = async (userId: string) => {
  try {
    const result = await User.deleteOne({ userId: userId })
    return result
  } catch (error) {
    console.error('Error occurred in deleteUser:', error)
    throw new Error('Error deleting user')
  }
}

export const addUserToTeam = async (userId: string, teamId: string) => {
  try {
    const user = await User.findById(userId)
    user.team = teamId
    await user.save()
    return user
  } catch (error) {
    console.error('Error occurred in addUserToTeam:', error)
    throw new Error('Error adding user to team')
  }
}

export const sendReminder = async (bot: any) => {
  const users = await getAllUsers()
  const today = new Date().toISOString().split('T')[0]
  for (const user of users) {
    if (!user.lastSubmission || user.lastSubmission.toISOString().split('T')[0] !== today) {
      try {
        const chat = await bot.telegram.getChat(user.userId)
        if (chat) {
          await bot.telegram.sendMessage(user.userId, reminderMessage)
        }
      } catch (err) {
        console.error(`Error sending reminder to ${user.username}:`, err)
      }
    }
  }
}

