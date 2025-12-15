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

// Global handler for "Back to Menu" button
bot.hears('« Back to Menu', onlyPrivate, (ctx: any) => ctx.scene.enter('menu_scene'))

// Global handler for "❌ Cancel" button - leaves current scene and goes to menu
bot.hears('❌ Cancel', onlyPrivate, async (ctx: any) => {
  await ctx.reply('Action cancelled.')
  await ctx.scene.enter('menu_scene')
})

// Global handlers for menu category buttons
bot.hears('👤 Profile', onlyPrivate, (ctx: any) => ctx.scene.enter('menu_scene'))
bot.hears('💪 Activities', onlyPrivate, (ctx: any) => ctx.scene.enter('menu_scene'))
bot.hears('📊 Statistics', onlyPrivate, (ctx: any) => ctx.scene.enter('menu_scene'))
bot.hears('👥 Teams', onlyPrivate, (ctx: any) => ctx.scene.enter('menu_scene'))
bot.hears('ℹ️ Information', onlyPrivate, (ctx: any) => ctx.scene.enter('menu_scene'))

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
  // Only show the main menu command in Telegram's menu button popup
  await bot.telegram.setMyCommands([
    { command: 'menu', description: '📋 Open main menu' }
  ])

  await bot.telegram.setChatMenuButton({
    menuButton: {
      type: 'commands'
    }
  })
}