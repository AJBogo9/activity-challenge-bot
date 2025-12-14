import mongoose from 'mongoose'

const teamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  guild: {
    type: String,
    enum: ['TiK', 'DG', 'FK', 'PT', 'AS', 'SIK', 'KIK', 'MK', 'IK', 'Athene', 'Prodeko', 'Inkubio', 'KY', 'TOKYO', 'AK', 'TF', 'PJK', 'VK', 'KK'],
    required: true
  },
  points: {
    exercise: { type: Number, default: 0 },
    sportsTurn: { type: Number, default: 0 },
    trySport: { type: Number, default: 0 },
    tryRecipe: { type: Number, default: 0 },
    goodSleep: { type: Number, default: 0 },
    meditate: { type: Number, default: 0 },
    lessAlc: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
  },
})

teamSchema.methods.addUserPoints = function (userPoints: any) {
  Object.keys(userPoints).forEach(key => {
    (this.points as any)[key] = ((this.points as any)[key] || 0) + userPoints[key]
  })
  return this.save()
}

teamSchema.methods.deleteUserPoints = function (userPoints: any) {
  Object.keys(userPoints).forEach(key => {
    (this.points as any)[key] = ((this.points as any)[key] || 0) - userPoints[key]
  })
  return this.save()
}

teamSchema.index({ guild: 1, 'points.total': -1 })
teamSchema.index({ _id: 1, 'points.total': -1 })

interface ITeam extends mongoose.Document {
  name: string;
  members: mongoose.Types.ObjectId[];
  guild: string;
  points: {
    exercise: number;
    sportsTurn: number;
    trySport: number;
    tryRecipe: number;
    goodSleep: number;
    meditate: number;
    lessAlc: number;
    total: number;
  };
  addUserPoints: (userPoints: any) => Promise<ITeam>;
  deleteUserPoints: (userPoints: any) => Promise<ITeam>;
}

const Team = mongoose.model<ITeam>('Team', teamSchema)
export default Team


