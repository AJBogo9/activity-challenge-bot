import { Telegraf, Scenes, session, Context } from 'telegraf'
import { telegramToken } from './config'
import * as flows from './flows'
import https from 'https'
import commandScenes from './config/commands'
import onlyPrivate from './utils/check-private'
import texts from './utils/texts'

interface MyContext extends Scenes.SceneContext { }

if (!telegramToken) {
  throw new Error('TELEGRAM_TOKEN is not defined in environment variables')
}

const agent = new https.Agent({ keepAlive: false })
export const bot = new Telegraf<MyContext>(telegramToken, { telegram: { agent } })

const stage = new Scenes.Stage<MyContext>(Object.values(flows) as any[])
bot.use(session())
bot.use(stage.middleware())

// Register all commands
commandScenes.forEach(({ command, scene, private: isPrivate }: any) => {
  if (isPrivate) {
    bot.command(command, onlyPrivate, (ctx: any) => ctx.scene.enter(scene))
  } else {
    bot.command(command, (ctx: any) => ctx.scene.enter(scene))
  }
})

bot.catch((err: any, ctx: any) => {
  console.error(`Encountered an error for ${ctx.updateType}`, err)
  try {
    ctx.reply(texts.actions.error.error)
  } catch (e) {
    console.error("Could not reply to error", e)
  }
})

// Setup bot commands for the menu
export const setupBotCommands = async () => {
  const commands = commandScenes
    .filter(({ description }: any) => description)
    .map(({ command, description }: any) => ({
      command,
      description
    }))

  await bot.telegram.setMyCommands(commands)
}