import { bot } from './instance'

export async function setupBotCommands() {
  // Show only essential commands in Telegram's menu
  await bot.telegram.setMyCommands([
    { command: 'menu', description: '🏠 Return to main menu' },
    { command: 'cancel', description: '❌ Cancel current action' }
  ])
  
  await bot.telegram.setChatMenuButton({
    menuButton: {
      type: 'default'
    }
  })
}