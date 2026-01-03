// src/bot/middleware.ts
import { Scenes, session, Telegraf } from 'telegraf'
import * as flows from '../flows'
import { TwoMessageManager } from '../utils'

type MyContext = Scenes.SceneContext

/**
 * Register all bot middleware in correct order
 * Order is critical: session → stage → custom middleware
 */
export function registerMiddleware(bot: Telegraf<MyContext>): void {
  // 1. Session middleware (must be first)
  bot.use(session())

  // 2. Stage middleware for scenes/wizards
  const stage = new Scenes.Stage<MyContext>(Object.values(flows) as any[])
  bot.use(stage.middleware())

  // 3. Two-message navigation handler
  bot.use(async (ctx, next) => {
    if (ctx.message && 'text' in ctx.message) {
      const handled = await TwoMessageManager.handleNavigation(ctx, ctx.message.text)
      if (handled) {
        return
      }
    }
    return next()
  })

  // 4. Error handler (catches all unhandled errors)
  bot.catch((err, ctx) => {
    console.error('❌ Bot error:', err)
    console.error('Context:', {
      updateType: ctx.updateType,
      chatId: ctx.chat?.id,
      userId: ctx.from?.id,
    })

    // Try to notify user
    ctx.reply('⚠️ An error occurred. Please try again or use /start')
      .catch(e => console.error('Failed to send error message:', e))
  })
}