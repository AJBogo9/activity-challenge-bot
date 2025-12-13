const mongoose = require('mongoose')
const { GUILDS, POINT_CATEGORIES } = require('../config/constants')

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
    enum: GUILDS, 
    required: true 
  },
  points: POINT_CATEGORIES,
  lastSubmission: {
    type: Date,
    default: null,
  }
}, { timestamps: true })

userSchema.index({ team: 1 })

userSchema.methods.addPoints = function(pointsData) {
  Object.keys(pointsData).forEach(key => {
    this.points[key] += pointsData[key]
    if (key.toString() === 'sportsTurn') { this.lastSubmission = new Date() }
  })
  return this.save()
}

const User = mongoose.model('User', userSchema)

User.validCategories = Object.keys(userSchema.obj.points)
User.validGuilds = userSchema.obj.guild.enum

module.exports = User
