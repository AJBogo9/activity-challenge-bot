import { bot } from './instance'

export async function setupBotCommands() {
  // Show start and menu commands in Telegram's menu button popup
  await bot.telegram.setMyCommands([])

  await bot.telegram.setChatMenuButton({
    menuButton: {
      type: 'default'
    }
  })
}