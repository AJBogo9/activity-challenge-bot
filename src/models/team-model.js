const mongoose = require('mongoose')
const { GUILDS, POINT_CATEGORIES } = require('../config/constants')

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
    enum: GUILDS, 
    required: true 
  },
  points: POINT_CATEGORIES,
})

teamSchema.methods.addUserPoints = function(userPoints) {
  Object.keys(userPoints).forEach(key => {
    this.points[key] = (this.points[key] || 0) + userPoints[key]
  })
  return this.save()
}

teamSchema.methods.deleteUserPoints = function(userPoints) {
  Object.keys(userPoints).forEach(key => {
    this.points[key] = (this.points[key] || 0) - userPoints[key]
  })
  return this.save()
}

teamSchema.index({ guild: 1, 'points.total': -1 })
teamSchema.index({ _id: 1, 'points.total': -1 })

const Team = mongoose.model('Team', teamSchema)
module.exports = Team
