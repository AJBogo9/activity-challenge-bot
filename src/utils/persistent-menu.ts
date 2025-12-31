// src/utils/persistent-menu.ts
export class PersistentMenu {
  /**
   * Update or create a submenu message with inline keyboard
   */
  static async updateSubmenu(ctx: any, text: string, inlineKeyboard: any) {
    try {
      // Try to edit existing submenu message
      if (ctx.session?.submenuMessageId) {
        await ctx.telegram.editMessageText(
          ctx.chat.id,
          ctx.session.submenuMessageId,
          undefined,
          text,
          {
            parse_mode: 'Markdown',
            ...inlineKeyboard
          }
        )
      } else {
        throw new Error('No submenu message to edit')
      }
    } catch (error) {
      // Create new submenu message if edit fails or doesn't exist
      const message = await ctx.replyWithMarkdown(text, inlineKeyboard)
      ctx.session.submenuMessageId = message.message_id
    }
  }
  
  /**
   * Delete the submenu message when returning to main menu
   */
  static async deleteSubmenu(ctx: any) {
    try {
      if (ctx.session?.submenuMessageId) {
        await ctx.telegram.deleteMessage(ctx.chat.id, ctx.session.submenuMessageId)
        delete ctx.session.submenuMessageId
      }
    } catch (error) {
      // Message might be too old (48h+) or already deleted
      console.log('Could not delete submenu message:', error)
      // Still clear from session
      delete ctx.session.submenuMessageId
    }
  }
  
  /**
   * Register reply keyboard handlers for navigation between submenus
   * Automatically deletes user's button press message to keep chat clean
   */
  static registerReplyKeyboardHandlers(scene: any, currentSceneName: string) {
    const menuItems = [
      { text: '👤 Profile', scene: 'profile' },
      { text: '💪 Log Activity', scene: 'sports_activity_wizard' },
      { text: '📊 Statistics', scene: 'stats_menu' },
      { text: 'ℹ️ Info', scene: 'info_menu' },
      { text: '💬 Feedback', scene: 'feedback_wizard' }
    ]
    
    menuItems.forEach(item => {
      scene.hears(item.text, async (ctx: any) => {
        // Delete the user's message to keep chat clean
        try {
          await ctx.deleteMessage()
        } catch (error) {
          // Silently ignore if deletion fails
        }
        
        // If clicking the same menu, just reenter (refresh)
        if (item.scene === currentSceneName) {
          return ctx.scene.reenter()
        }
        // Otherwise navigate to the new scene
        return ctx.scene.enter(item.scene)
      })
    })
  }
}