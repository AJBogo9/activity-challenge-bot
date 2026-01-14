import { Markup } from 'telegraf'

// Centralized navigation configuration
const NAVIGATION_MAP: Record<string, string> = {
  '📝 Register': 'register_wizard',
  'ℹ️ Info': 'info_menu',
  '👤 Profile': 'profile',
  '💪 Log Activity': 'activity_wizard',
  '📊 Statistics': 'stats_menu',
  '💬 Feedback': 'feedback_wizard'
}

const DEFAULT_KEYBOARD_BUTTONS = [
  ['👤 Profile', '💪 Log Activity'],
  ['📊 Statistics', 'ℹ️ Info'],
  ['💬 Feedback']
]

export class TwoMessageManager {
  /**
   * Initialize the two persistent messages
   */
  static async init(
    ctx: any,
    buttons: string[][] = DEFAULT_KEYBOARD_BUTTONS,
    keyboardText = '📱 *Main Navigation*'
  ) {
    await this.cleanup(ctx)

    // Create content message
    const contentMsg = await ctx.reply('⏳ Loading...')
    ctx.session.contentMessageId = contentMsg.message_id

    // Create keyboard message
    const keyboardMsg = await ctx.reply(keyboardText, {
      parse_mode: 'MarkdownV2',
      ...Markup.keyboard(buttons).resize().persistent()
    })
    ctx.session.keyboardMessageId = keyboardMsg.message_id
  }

  /**
   * Update the content message with new text and inline keyboard
   */
  static async updateContent(ctx: any, text: string, inlineKeyboard?: any) {
    const options = {
      parse_mode: 'MarkdownV2' as const,
      ...(inlineKeyboard || {})
    }

    try {
      if (!ctx.session?.contentMessageId) {
        throw new Error('No content message exists')
      }

      await ctx.telegram.editMessageText(
        ctx.chat.id,
        ctx.session.contentMessageId,
        undefined,
        text,
        options
      )
    } catch (error) {
      // If edit fails, create new content message
      const contentMsg = await ctx.reply(text, options)
      ctx.session.contentMessageId = contentMsg.message_id
    }
  }

  /**
   * Update reply keyboard
   */
  static async updateKeyboard(
    ctx: any,
    buttons: string[][],
    text = '📱 *Main Navigation*'
  ) {
    const options = {
      parse_mode: 'MarkdownV2' as const,
      ...Markup.keyboard(buttons).resize().persistent()
    }

    try {
      if (!ctx.session?.keyboardMessageId) {
        throw new Error('No keyboard message exists')
      }

      await ctx.telegram.editMessageText(
        ctx.chat.id,
        ctx.session.keyboardMessageId,
        undefined,
        text,
        options
      )
    } catch (error) {
      // If edit fails, create new keyboard message
      const keyboardMsg = await ctx.reply(text, options)
      ctx.session.keyboardMessageId = keyboardMsg.message_id
    }
  }

  /**
   * Navigate to a scene and delete user's message
   */
  static async navigateToScene(ctx: any, sceneId: string) {
    await this.deleteUserMessage(ctx)
    await this.enterScene(ctx, sceneId)
  }

  /**
   * Enter a scene only if not already there
   */
  static async enterScene(ctx: any, sceneId: string) {
    if (ctx.scene.current?.id !== sceneId) {
      await ctx.scene.enter(sceneId)
    }
  }

  /**
   * Handle keyboard button navigation
   */
  static async handleNavigation(ctx: any, buttonText: string): Promise<boolean> {
    const targetScene = NAVIGATION_MAP[buttonText]
    if (targetScene) {
      await this.navigateToScene(ctx, targetScene)
      return true
    }
    return false
  }

  /**
   * Cleanup old messages
   */
  static async cleanup(ctx: any) {
    const messageIds = [
      ctx.session?.contentMessageId,
      ctx.session?.keyboardMessageId
    ].filter(Boolean)

    await Promise.allSettled(
      messageIds.map(id => ctx.telegram.deleteMessage(ctx.chat.id, id))
    )

    delete ctx.session.contentMessageId
    delete ctx.session.keyboardMessageId
  }

  /**
   * Delete user's message to keep chat clean
   */
  static async deleteUserMessage(ctx: any) {
    if (ctx.message?.message_id) {
      try {
        await ctx.deleteMessage()
      } catch {
        // Silently ignore deletion errors
      }
    }
  }

  /**
   * Middleware for wizards/scenes to allow escape via /start or reply keyboard
   */
  static createEscapeMiddleware() {
    return async (ctx: any, next: any) => {
      const messageText = ctx.message?.text

      if (!messageText) {
        return next()
      }

      // Handle /start command
      if (messageText === '/start') {
        if (ctx.wizard) {
          ctx.wizard.state = {}
        }
        await this.deleteUserMessage(ctx)
        await ctx.scene.enter('menu_router')
        return
      }

      // Handle navigation buttons
      const targetScene = NAVIGATION_MAP[messageText]
      if (targetScene && ctx.scene.current?.id !== targetScene) {
        if (ctx.wizard) {
          ctx.wizard.state = {}
        }
        await this.deleteUserMessage(ctx)
        await ctx.scene.enter(targetScene)
        return
      }

      return next()
    }
  }
}