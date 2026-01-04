import { Markup } from 'telegraf'

export class TwoMessageManager {
  /**
   * Initialize the two persistent messages
   * Call this once when user starts or returns to main menu
   * @param ctx - Telegraf context
   * @param buttons - Optional custom keyboard layout. If not provided, uses default registered layout
   * @param keyboardText - Text to display above the keyboard
   */
  static async init(
    ctx: any,
    buttons?: string[][],
    keyboardText = '📱 *Main Navigation*'
  ) {
    // Delete old messages if they exist
    await this.cleanup(ctx)

    // Create content message (will be edited later)
    const contentMsg = await ctx.reply('⏳ Loading...')
    ctx.session.contentMessageId = contentMsg.message_id

    // Default buttons for registered users
    const defaultButtons = [
      ['👤 Profile', '💪 Log Activity'],
      ['📊 Statistics', 'ℹ️ Info'],
      ['💬 Feedback']
    ]

    // Create reply keyboard message (stays at bottom)
    const keyboardMsg = await ctx.reply(keyboardText, {
      parse_mode: 'Markdown',
      ...Markup.keyboard(buttons || defaultButtons)
        .resize()
        .persistent()
    })
    ctx.session.keyboardMessageId = keyboardMsg.message_id
  }

  /**
   * Update the content message with new text and inline keyboard
   * Also tracks the current scene to prevent duplicate updates
   */
  static async updateContent(ctx: any, text: string, inlineKeyboard?: any) {
    try {
      if (!ctx.session?.contentMessageId) {
        throw new Error('No content message exists')
      }

      // Store current scene and content for comparison
      const currentSceneId = ctx.scene.current?.id
      const lastSceneId = ctx.session.lastSceneId
      const lastContent = ctx.session.lastContent

      // If we're in the same scene with the same content, skip update
      if (currentSceneId === lastSceneId && text === lastContent) {
        return
      }

      await ctx.telegram.editMessageText(
        ctx.chat.id,
        ctx.session.contentMessageId,
        undefined,
        text,
        {
          parse_mode: 'Markdown',
          ...inlineKeyboard
        }
      )

      // Track the scene and content we just displayed
      ctx.session.lastSceneId = currentSceneId
      ctx.session.lastContent = text
    } catch (error) {
      // If edit fails (message too old or deleted), create new content message
      const contentMsg = await ctx.replyWithMarkdown(text, inlineKeyboard)
      ctx.session.contentMessageId = contentMsg.message_id
      
      // Track the scene and content
      ctx.session.lastSceneId = ctx.scene.current?.id
      ctx.session.lastContent = text
    }
  }

  /**
   * Update reply keyboard (for different user states, e.g., registered vs unregistered)
   */
  static async updateKeyboard(ctx: any, buttons: string[][], text = '📱 *Main Navigation*') {
    try {
      if (!ctx.session?.keyboardMessageId) {
        throw new Error('No keyboard message exists')
      }

      await ctx.telegram.editMessageText(
        ctx.chat.id,
        ctx.session.keyboardMessageId,
        undefined,
        text,
        {
          parse_mode: 'Markdown',
          ...Markup.keyboard(buttons).resize().persistent()
        }
      )
    } catch (error) {
      // If edit fails, create new keyboard message
      const keyboardMsg = await ctx.reply(text, {
        parse_mode: 'Markdown',
        ...Markup.keyboard(buttons).resize().persistent()
      })
      ctx.session.keyboardMessageId = keyboardMsg.message_id
    }
  }

  /**
   * Navigate to a scene, but only if not already there
   * Automatically deletes user messages to keep chat clean
   */
  static async navigateToScene(ctx: any, sceneId: string) {
    // Delete the user's message first
    await this.deleteUserMessage(ctx)
    
    // Only enter if not already in that scene
    if (ctx.scene.current?.id !== sceneId) {
      await ctx.scene.enter(sceneId)
    }
  }

  /**
   * Navigate to a scene without deleting user messages
   * Useful for programmatic navigation (e.g., from .enter() hooks)
   */
  static async enterScene(ctx: any, sceneId: string) {
    // Only enter if not already in that scene
    if (ctx.scene.current?.id !== sceneId) {
      await ctx.scene.enter(sceneId)
    }
  }

  /**
   * Handle keyboard button navigation
   * Maps button text to scene IDs
   */
  static async handleNavigation(ctx: any, buttonText: string) {
    // Map of reply keyboard buttons to their target scenes
    const navigationMap: Record<string, string> = {
      '📝 Register': 'register_wizard',
      'ℹ️ Info': 'info_menu',
      '👤 Profile': 'profile',
      '💪 Log Activity': 'activity_wizard',
      '📊 Statistics': 'stats_menu',
      '💬 Feedback': 'feedback_wizard'
    }

    const targetScene = navigationMap[buttonText]
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
    const messagesToDelete = [
      ctx.session?.contentMessageId,
      ctx.session?.keyboardMessageId
    ]

    for (const messageId of messagesToDelete) {
      if (messageId) {
        try {
          await ctx.telegram.deleteMessage(ctx.chat.id, messageId)
        } catch (error) {
          // Silently ignore deletion errors
        }
      }
    }

    delete ctx.session.contentMessageId
    delete ctx.session.keyboardMessageId
    delete ctx.session.lastSceneId
    delete ctx.session.lastContent
  }

  /**
   * Delete any user messages to keep chat clean
   */
  static async deleteUserMessage(ctx: any) {
    try {
      if (ctx.message?.message_id) {
        await ctx.deleteMessage()
      }
    } catch (error) {
      // Silently ignore if deletion fails
    }
  }

  /**
   * Middleware for wizards/scenes to allow escape via /start or reply keyboard
   * Add this to any wizard/scene where users should be able to navigate away
   * 
   * @example
   * myWizard.use(TwoMessageManager.createEscapeMiddleware())
   */
  static createEscapeMiddleware() {
    return async (ctx: any, next: any) => {
      // Only intercept if we have a text message
      if (!ctx.message || !('text' in ctx.message)) {
        return next()
      }

      const messageText = ctx.message.text

      // Check for /start command
      if (messageText === '/start') {
        // Clear any wizard state if in a wizard
        if (ctx.wizard) {
          ctx.wizard.state = {}
        }
        
        // Navigate to menu router
        await this.deleteUserMessage(ctx)
        await ctx.scene.enter('menu_router')
        return
      }
      
      // Check for reply keyboard navigation
      // Map of reply keyboard buttons to their target scenes
      const navigationMap: Record<string, string> = {
        '📝 Register': 'register_wizard',
        'ℹ️ Info': 'info_menu',
        '👤 Profile': 'profile',
        '💪 Log Activity': 'activity_wizard',
        '📊 Statistics': 'stats_menu',
        '💬 Feedback': 'feedback_wizard'
      }

      const targetScene = navigationMap[messageText]
      
      // Only intercept if it's a navigation button AND we're not already entering that scene
      if (targetScene && ctx.scene.current?.id !== targetScene) {
        // Clear wizard state if in a wizard
        if (ctx.wizard) {
          ctx.wizard.state = {}
        }
        
        // Navigate away
        await this.deleteUserMessage(ctx)
        await ctx.scene.enter(targetScene)
        return
      }
      
      // If not a navigation command, continue to next middleware/handler
      return next()
    }
  }
}