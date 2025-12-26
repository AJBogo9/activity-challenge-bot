import { Telegraf, Scenes } from 'telegraf'
import https from 'https'
import { botToken } from '../constants'

type MyContext = Scenes.SceneContext

if (!botToken) {
  throw new Error('TELEGRAM_TOKEN is not defined in environment variables')
}

const agent = new https.Agent({ keepAlive: false })

export const bot = new Telegraf<MyContext>(botToken, { telegram: { agent } })