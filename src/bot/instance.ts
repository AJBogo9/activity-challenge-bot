import { Telegraf, Scenes } from 'telegraf'
import https from 'https'
import { telegramToken } from '../config/constants'

type MyContext = Scenes.SceneContext

if (!telegramToken) {
  throw new Error('TELEGRAM_TOKEN is not defined in environment variables')
}

const agent = new https.Agent({ keepAlive: false })

export const bot = new Telegraf<MyContext>(telegramToken, { telegram: { agent } })