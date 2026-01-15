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

// List of wizard scene IDs (scenes that should be restarted if already active)
const WIZARD_SCENES = new Set([
  'activity_wizard',
  'register_wizard',
  'feedback_wizard'
])

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
    } catch {
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
    } catch {
      // If edit fails, create new keyboard message
      const keyboardMsg = await ctx.reply(text, options)
      ctx.session.keyboardMessageId = keyboardMsg.message_id
    }
  }

  /**
   * Navigate to a scene and delete user's message
   * - For wizards: always restart (even if already in that wizard)
   * - For scenes: do nothing if already there
   */
  static async navigateToScene(ctx: any, sceneId: string) {
    await this.deleteUserMessage(ctx)
    
    const currentSceneId = ctx.scene.current?.id
    
    // If already in this scene
    if (currentSceneId === sceneId) {
      // Check if this is a wizard scene (by ID pattern)
      const isWizard = WIZARD_SCENES.has(sceneId)
      
      if (isWizard) {
        // Restart the wizard by leaving and re-entering
        await ctx.scene.leave()
        await ctx.scene.enter(sceneId)
      }
      // If it's a regular scene, do nothing (stay in place)
      return
    }
    
    // Different scene, navigate to it
    await ctx.scene.enter(sceneId)
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
   * CENTRALIZED navigation middleware - handles ALL reply keyboard navigation
   * This should be used as GLOBAL middleware, NOT in individual wizards
   */
  static createNavigationMiddleware() {
    return async (ctx: any, next: any) => {
      // Only handle text messages (reply keyboard), not callback queries (inline buttons)
      if (!ctx.message?.text) {
        return next()
      }

      const messageText = ctx.message.text

      // Handle /start command
      if (messageText === '/start') {
        await this.navigateToScene(ctx, 'menu_router')
        return
      }

      // Handle navigation buttons from NAVIGATION_MAP
      const targetScene = NAVIGATION_MAP[messageText]
      if (targetScene) {
        await this.navigateToScene(ctx, targetScene)
        return
      }

      // Not a navigation button, pass to next handler
      return next()
    }
  }

  /**
   * Wizard middleware - ONLY handles wizard-specific input validation
   * Does NOT handle navigation (that's done by global middleware)
   */
  static createWizardMiddleware() {
    return async (ctx: any, next: any) => {
      // This middleware just passes through - navigation is handled globally
      // Wizards can add their own validation here if needed
      return next()
    }
  }
}