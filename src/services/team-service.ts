import Team from '../models/team-model'
import User from '../models/user-model'

export const createTeam = async (teamName: string, guild: string) => {
  try {
    const team = new Team({ name: teamName, guild: guild })
    await team.save()
    return team
  } catch (error) {
    console.error('Error occurred in createTeam:', error)
    throw error
  }
}

export const getTeamById = async (teamId: string) => {
  try {
    const team = await Team.findById(teamId)
    return team
  } catch (error) {
    console.error('Error occurred in getTeamById:', error)
    throw new Error('Error retrieving team')
  }
}

export const joinTeam = async (userId: string | number, teamId: string) => {
  try {
    const team = await Team.findById(teamId)
    const user = await User.findById(userId)
    if (team && user) {
      await team.addUserPoints((user as any).points)
      team.members.push(userId as any)
      await team.save()
    }
  } catch (error) {
    console.error('Error occurred in joinTeam:', error)
    throw new Error('Error joining team')
  }
}

export const deleteTeam = async (teamId: string) => {
  try {
    const result = await Team.deleteOne({ _id: teamId })
    return result
  } catch (error) {
    console.error('Error occurred in deleteTeam:', error)
    throw new Error('Error deleting team')
  }
}

export const leaveTeam = async (userId: string | number, teamId: string) => {
  try {
    const team = await Team.findById(teamId)
    const user = await User.findById(userId)
    if (team && user) {
      await team.deleteUserPoints((user as any).points)
      team.members = team.members.filter((memberId: any) => memberId.toString() !== userId.toString())
      await team.save()
    }
    await User.findByIdAndUpdate(userId, { $unset: { team: 1 } })
    if (user) {
      await user.save()
    }
    if (team && team.members.length === 0) await deleteTeam(teamId)
  } catch (error) {
    console.error('Error occurred in leaveTeam:', error)
    throw new Error('Error leaving team')
  }
}
