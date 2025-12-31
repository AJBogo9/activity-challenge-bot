import { bot } from './instance'

export async function setupBotCommands() {
  // Show only the start command in Telegram's menu
  await bot.telegram.setMyCommands([
    { command: 'start', description: '🏠 Start or return to main menu' }
  ])
  
  await bot.telegram.setChatMenuButton({
    menuButton: {
      type: 'default'
    }
  })
}