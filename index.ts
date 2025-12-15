import { connectDatabase, disconnectDatabase } from './src/database'
import { bot, setupBotCommands } from './src/bot'
import scheduleReminders from './src/utils/schedule-reminders'

async function handleError(error: any) {
  console.error('Unexpected error occurred:', error)

  if (error.response && error.response.description) {
    console.error('Error response:', error.response.description)
  }

  if (error.response && error.response.error_code === 403) {
    console.error('Handling 403 error: The bot was kicked from the group chat')
  }

  console.log('Attempting to restart the bot...')
  setTimeout(startBot, 5000)
}

async function startBot() {
  try {
    await connectDatabase()
    await setupBotCommands()
    scheduleReminders()
    console.log('Bot started')
    await bot.launch()
  } catch (err) {
    console.error('Could not start the bot:', err)
    handleError(err)
  }
}

startBot()

process.once('SIGINT', () => {
  bot.stop('SIGINT')
  disconnectDatabase()
    .then(() => process.exit(0))
    .catch((error: any) => {
      console.error('Error during shutdown:', error)
      process.exit(1)
    })
})

process.once('SIGTERM', () => {
  bot.stop('SIGTERM')
  disconnectDatabase()
    .then(() => process.exit(0))
    .catch((error: any) => {
      console.error('Error during shutdown:', error)
      process.exit(1)
    })
})
