import { Markup } from 'telegraf'

export class TwoMessageManager {
  /**
   * Initialize the two persistent messages
   * Call this once when user starts or returns to main menu
   */
  static async init(ctx: any) {
    // Delete old messages if they exist
    await this.cleanup(ctx)

    // Create content message (will be edited later)
    const contentMsg = await ctx.reply('⏳ Loading...')
    ctx.session.contentMessageId = contentMsg.message_id

    // Create reply keyboard message (stays at bottom)
    const keyboardMsg = await ctx.reply(
      '📱 *Main Navigation*',
      {
        parse_mode: 'Markdown',
        ...Markup.keyboard([
          ['👤 Profile', '💪 Log Activity'],
          ['📊 Statistics', 'ℹ️ Info'],
          ['💬 Feedback']
        ])
          .resize()
          .persistent()
      }
    )
    ctx.session.keyboardMessageId = keyboardMsg.message_id
  }

  /**
   * Update the content message with new text and inline keyboard
   */
  static async updateContent(ctx: any, text: string, inlineKeyboard?: any) {
    try {
      if (!ctx.session?.contentMessageId) {
        throw new Error('No content message exists')
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
    } catch (error) {
      // If edit fails (message too old or deleted), create new content message
      const contentMsg = await ctx.replyWithMarkdown(text, inlineKeyboard)
      ctx.session.contentMessageId = contentMsg.message_id
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
      const keyboardMsg = await ctx.reply(
        text,
        {
          parse_mode: 'Markdown',
          ...Markup.keyboard(buttons).resize().persistent()
        }
      )
      ctx.session.keyboardMessageId = keyboardMsg.message_id
    }
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
}