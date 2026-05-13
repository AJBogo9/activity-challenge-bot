import { bot } from './instance'

export async function setupBotCommands() {
  await bot.telegram.setMyCommands([
    { command: 'start', description: '🏠 Start or return to main menu' }
  ])

  const webAppUrl = process.env.WEBAPP_URL
  await bot.telegram.setChatMenuButton({
    menuButton: webAppUrl
      ? { type: 'web_app', text: 'Open Dashboard', web_app: { url: webAppUrl } }
      : { type: 'default' }
  })
}