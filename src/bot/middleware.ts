// src/bot/middleware.ts
import { Scenes, session, Telegraf } from 'telegraf'
import * as flows from '../flows'
import { TwoMessageManager } from '../utils'

type MyContext = Scenes.SceneContext

export function registerMiddleware(bot: Telegraf<MyContext>): void {
  // 1. Session middleware (must be first)
  bot.use(session())

  // 2. Stage middleware for scenes/wizards
  const stage = new Scenes.Stage<MyContext>(Object.values(flows) as any[])
  
  // Apply navigation middleware FIRST within the stage
  stage.use(TwoMessageManager.createNavigationMiddleware())
  
  // Then apply wizard middleware
  stage.use(TwoMessageManager.createWizardMiddleware())
  
  bot.use(stage.middleware())

  // 4. Error handler (catches all unhandled errors)
  bot.catch((err, ctx) => {
    console.error('❌ Bot error:', err)
    console.error('Context:', {
      updateType: ctx.updateType,
      chatId: ctx.chat?.id,
      userId: ctx.from?.id,
    })
    ctx.reply('⚠️ An error occurred. Please try again or use /start')
      .catch(e => console.error('Failed to send error message:', e))
  })
}