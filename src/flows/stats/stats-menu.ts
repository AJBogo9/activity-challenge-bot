import { Scenes, Markup } from 'telegraf'
import { TwoMessageManager } from '../../utils'

export const statsMenuScene = new Scenes.BaseScene<any>('stats_menu')

statsMenuScene.enter(async (ctx: any) => {
  const message = `📊 *Statistics*

View global rankings, guild standings, and your personal progress in our interactive dashboard:`

  const webAppUrl = process.env.WEBAPP_URL || 'https://your-app-url.com'

  const keyboard = Markup.inlineKeyboard([
    [
      Markup.button.webApp('📊 Open Dashboard', webAppUrl)
    ]
  ])

  await TwoMessageManager.updateContent(ctx, message, keyboard)
})