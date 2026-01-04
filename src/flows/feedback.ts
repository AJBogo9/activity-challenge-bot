import { Scenes, Markup } from 'telegraf'
import { findUserByTelegramId, saveFeedback } from '../db'
import { TwoMessageManager } from '../utils'

// Wizard scene for feedback collection
export const feedbackWizard = new Scenes.WizardScene<any>(
  'feedback_wizard',
  
  // Step 1: Ease of Use
  async (ctx: any) => {
    ctx.wizard.state.feedback = {}
    
    await TwoMessageManager.updateContent(
      ctx,
      '📝 *Feedback \\- Step 1/4*\n\n' +
      'How easy was it to use this bot?\n\n' +
      '1 \\= Very Difficult\n' +
      '5 \\= Very Easy',
      Markup.inlineKeyboard([
        [
          Markup.button.callback('1', 'rate_1'),
          Markup.button.callback('2', 'rate_2'),
          Markup.button.callback('3', 'rate_3'),
          Markup.button.callback('4', 'rate_4'),
          Markup.button.callback('5', 'rate_5'),
        ],
        [Markup.button.callback('❌ Cancel', 'cancel_feedback')]
      ])
    )
    
    return ctx.wizard.next()
  },
  
  // Step 2: Usefulness
  async (ctx: any) => {
    if (ctx.callbackQuery) {
      const data = ctx.callbackQuery.data
      
      if (data === 'cancel_feedback') {
        await TwoMessageManager.updateContent(ctx, '❌ Feedback cancelled\\.')
        await ctx.answerCbQuery()
        return ctx.scene.enter('registered_menu')
      }
      
      const rating = parseInt(data.split('_')[1])
      ctx.wizard.state.feedback.easeOfUse = rating
      
      await TwoMessageManager.updateContent(
        ctx,
        '📝 *Feedback \\- Step 2/4*\n\n' +
        'How useful do you find this bot?\n\n' +
        '1 \\= Not Useful at All\n' +
        '5 \\= Extremely Useful',
        Markup.inlineKeyboard([
          [
            Markup.button.callback('1', 'rate_1'),
            Markup.button.callback('2', 'rate_2'),
            Markup.button.callback('3', 'rate_3'),
            Markup.button.callback('4', 'rate_4'),
            Markup.button.callback('5', 'rate_5'),
          ],
          [Markup.button.callback('❌ Cancel', 'cancel_feedback')]
        ])
      )
      
      await ctx.answerCbQuery()
      return ctx.wizard.next()
    }
  },
  
  // Step 3: Overall Satisfaction
  async (ctx: any) => {
    if (ctx.callbackQuery) {
      const data = ctx.callbackQuery.data
      
      if (data === 'cancel_feedback') {
        await TwoMessageManager.updateContent(ctx, '❌ Feedback cancelled\\.')
        await ctx.answerCbQuery()
        return ctx.scene.enter('registered_menu')
      }
      
      const rating = parseInt(data.split('_')[1])
      ctx.wizard.state.feedback.usefulness = rating
      
      await TwoMessageManager.updateContent(
        ctx,
        '📝 *Feedback \\- Step 3/4*\n\n' +
        'Overall, how satisfied are you with this bot?\n\n' +
        '1 \\= Very Dissatisfied\n' +
        '5 \\= Very Satisfied',
        Markup.inlineKeyboard([
          [
            Markup.button.callback('1', 'rate_1'),
            Markup.button.callback('2', 'rate_2'),
            Markup.button.callback('3', 'rate_3'),
            Markup.button.callback('4', 'rate_4'),
            Markup.button.callback('5', 'rate_5'),
          ],
          [Markup.button.callback('❌ Cancel', 'cancel_feedback')]
        ])
      )
      
      await ctx.answerCbQuery()
      return ctx.wizard.next()
    }
  },
  
  // Step 4: Text Feedback
  async (ctx: any) => {
    if (ctx.callbackQuery) {
      const data = ctx.callbackQuery.data
      
      if (data === 'cancel_feedback') {
        await TwoMessageManager.updateContent(ctx, '❌ Feedback cancelled\\.')
        await ctx.answerCbQuery()
        return ctx.scene.enter('registered_menu')
      }
      
      const rating = parseInt(data.split('_')[1])
      ctx.wizard.state.feedback.overallSatisfaction = rating
      
      await TwoMessageManager.updateContent(
        ctx,
        '📝 *Feedback \\- Step 4/4*\n\n' +
        'Great\\! Now please share your detailed feedback\\.\n\n' +
        'What would you like to tell us? What can we improve? ' +
        'What features would you like to see?\n\n' +
        '💡 *This is the most valuable part of your feedback\\!*\n\n' +
        'Type your message below:',
        Markup.inlineKeyboard([
          [Markup.button.callback('❌ Cancel', 'cancel_feedback')]
        ])
      )
      
      await ctx.answerCbQuery()
      return ctx.wizard.next()
    }
  },
  
  // Step 5: Save Feedback
  async (ctx: any) => {
    if (ctx.callbackQuery?.data === 'cancel_feedback') {
      await TwoMessageManager.updateContent(ctx, '❌ Feedback cancelled\\.')
      await ctx.answerCbQuery()
      return ctx.scene.enter('registered_menu')
    }
    
    if (ctx.message?.text) {
      // Delete user's text message to keep chat clean
      await TwoMessageManager.deleteUserMessage(ctx)
      
      const textFeedback = ctx.message.text.trim()
      
      if (textFeedback.length < 10) {
        await TwoMessageManager.updateContent(
          ctx,
          '⚠️ Please provide at least 10 characters of feedback\\. ' +
          'Your detailed thoughts are valuable to us\\!\n\n' +
          'Type your message below:',
          Markup.inlineKeyboard([
            [Markup.button.callback('❌ Cancel', 'cancel_feedback')]
          ])
        )
        return
      }
      
      try {
        // Get user from database
        const user = await findUserByTelegramId(ctx.from.id.toString())
        
        if (!user) {
          await TwoMessageManager.updateContent(
            ctx,
            '❌ Please register first before submitting feedback\\.'
          )
          return ctx.scene.enter('registered_menu')
        }
        
        // Save feedback
        await saveFeedback({
          userId: user.id,
          easeOfUse: ctx.wizard.state.feedback.easeOfUse,
          usefulness: ctx.wizard.state.feedback.usefulness,
          overallSatisfaction: ctx.wizard.state.feedback.overallSatisfaction,
          textFeedback,
        })
        
        await TwoMessageManager.updateContent(
          ctx,
          '✅ *Thank you for your feedback\\!*\n\n' +
          'Your input is incredibly valuable and helps us improve the bot\\. ' +
          'We truly appreciate you taking the time to share your thoughts\\! 🙏'
        )
        
        // Wait a moment before returning to menu
        await new Promise(resolve => setTimeout(resolve, 2000))
        return ctx.scene.enter('registered_menu')
      } catch (error) {
        console.error('Error saving feedback:', error)
        await TwoMessageManager.updateContent(
          ctx,
          '❌ Sorry, there was an error saving your feedback\\. Please try again later\\.'
        )
        
        // Wait a moment before returning to menu
        await new Promise(resolve => setTimeout(resolve, 2000))
        return ctx.scene.enter('registered_menu')
      }
    }
  }
)

feedbackWizard.use(TwoMessageManager.createEscapeMiddleware())

// Handle cancel callback in all steps
feedbackWizard.action('cancel_feedback', async (ctx: any) => {
  await TwoMessageManager.updateContent(ctx, '❌ Feedback cancelled\\.')
  await ctx.answerCbQuery()
  
  // Wait a moment before returning to menu
  await new Promise(resolve => setTimeout(resolve, 1000))
  return ctx.scene.enter('registered_menu')
})