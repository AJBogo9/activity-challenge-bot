import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true
  },
  username: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  },
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
  },,
  lastSubmission: {
    type: Date,
    default: null,
  }
}, { timestamps: true })

userSchema.index({ team: 1 })

userSchema.methods.addPoints = function (pointsData: any) {
  Object.keys(pointsData).forEach(key => {
    (this.points as any)[key] += pointsData[key]
    if (key.toString() === 'sportsTurn') { this.lastSubmission = new Date() }
  })
  return this.save()
}

const User = mongoose.model('User', userSchema) as any
// assigning static properties to the model if needed, though with Mongoose + TS it's often better to define interfaces.
// keeping it simple for migration:
// Accessing strict schemas requires casting or proper Mongoose typing
User.validCategories = Object.keys((userSchema.obj as any).points)
User.validGuilds = (userSchema.path('guild') as any).enumValues

export default User

