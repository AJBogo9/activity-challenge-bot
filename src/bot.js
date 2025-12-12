const { Telegraf, Scenes, session } = require('telegraf')
const { telegramToken } = require('./config')
const flows = require('./flows')
const https = require('https')
const commandScenes = require('./config/commands')

const agent = new https.Agent({ keepAlive: false })
const bot = new Telegraf(telegramToken, { telegram: { agent } })

const onlyPrivate = require('./utils/check-private')
const texts = require('./utils/texts')

const stage = new Scenes.Stage(Object.values(flows))
bot.use(session())
bot.use(stage.middleware())

// Register all commands
commandScenes.forEach(({ command, scene, private: isPrivate }) => {
  if (isPrivate) {
    bot.command(command, onlyPrivate, (ctx) => ctx.scene.enter(scene))
  } else {
    bot.command(command, (ctx) => ctx.scene.enter(scene))
  }
})

bot.catch((err, ctx) => { 
  console.error(`Encountered an error for ${ctx.updateType}`, err) 
  ctx.reply(texts.actions.error.error)
})

module.exports = bot