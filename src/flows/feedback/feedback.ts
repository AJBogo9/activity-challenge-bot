// import { Scenes, Markup } from 'telegraf'
// import Feedback from '../../models/feedback-model'
// import { isNotCallback } from '../../utils/flow-helpers'

// const MAX_FEEDBACK_LENGTH = 1000
// const MAX_FEEDBACKS_PER_USER = 2

// const MESSAGES = {
//   trainingHours: 'How many hours do you typically train per week? (Enter a number)',
//   trainingHoursConfirm: (hours: number) => `How many hours do you typically train per week? ${hours} hours.`,
//   invalidNumber: 'Invalid number. Please enter a positive number for your training hours.',
//   enjoymentRating: 'On a scale of 1–10, how much did you enjoy the challenge?',
//   enjoymentRatingConfirm: (rating: number) => `On a scale of 1–10, how much did you enjoy the challenge? You gave a rating of ${rating}.`,
//   improvementPrompt: `What could be improved? Please write your feedback below. (max ${MAX_FEEDBACK_LENGTH} characters)`,
//   improvementConfirm: 'What could be improved? Please write your feedback below.',
//   textRequired: 'Please provide your suggestions for improvement as text.',
//   tooLong: `Your feedback is too long (max ${MAX_FEEDBACK_LENGTH} characters). Please shorten your message.`,
//   maxReached: 'You have reached the maximum number of feedback submissions allowed.',
//   thankYou: 'Thank you for your feedback!',
//   error: 'There was an error saving your feedback. Please try again or contact @EppuRuotsalainen.',
//   canceled: 'Feedback process canceled. You can start again with /feedback.',
//   invalidRating: 'Invalid rating. Please choose a value between 1 and 10.'
// }

// const cancelKeyboard = Markup.inlineKeyboard([
//   Markup.button.callback('Cancel', 'exit_wizard')
// ])

// const createRatingKeyboard = () => {
//   const ratingButtons = Array.from({ length: 10 }, (_, i) => 
//     Markup.button.callback(String(i + 1), `rating_${i + 1}`)
//   )
  
//   const rows = []
//   for (let i = 0; i < ratingButtons.length; i += 5) {
//     rows.push(ratingButtons.slice(i, i + 5))
//   }
//   rows.push([Markup.button.callback('Cancel & Exit', 'exit_wizard')])
  
//   return Markup.inlineKeyboard(rows)
// }

// export const feedbackWizard = new Scenes.WizardScene(
//   'feedback_wizard',
//   // Step 1: Ask for training hours
//   async (ctx: any) => {
//     const sentMessage = await ctx.reply(
//       MESSAGES.trainingHours,
//       cancelKeyboard
//     )
//     ctx.wizard.state.trainingMessageId = sentMessage.message_id
//     return ctx.wizard.next()
//   },
  
//   // Step 2: Validate training hours and ask for rating
//   async (ctx: any) => {
//     const input = ctx.message.text.trim()
//     const hours = parseFloat(input)
    
//     if (isNaN(hours) || hours < 0) {
//       await ctx.reply(MESSAGES.invalidNumber)
//       return
//     }
    
//     ctx.wizard.state.trainingHours = hours
    
//     await ctx.telegram.editMessageText(
//       ctx.chat.id,
//       ctx.wizard.state.trainingMessageId,
//       null,
//       MESSAGES.trainingHoursConfirm(hours)
//     )

//     const sentMessage = await ctx.reply(
//       MESSAGES.enjoymentRating,
//       createRatingKeyboard()
//     )
//     ctx.wizard.state.buttonMessageId = sentMessage.message_id
//     return ctx.wizard.next()
//   },
  
//   // Step 3: Ask for improvement feedback (triggered by rating callback)
//   async (ctx: any) => {
//     if (await isNotCallback(ctx)) return
    
//     const sentMessage = await ctx.reply(
//       MESSAGES.improvementPrompt,
//       cancelKeyboard
//     )
//     ctx.wizard.state.feedbackMessageId = sentMessage.message_id
//     return ctx.wizard.next()
//   },
  
//   // Step 4: Save feedback
//   async (ctx: any) => {
//     if (!ctx.message || !ctx.message.text) {
//       await ctx.reply(MESSAGES.textRequired)
//       return
//     }
    
//     const text = ctx.message.text.trim()
    
//     if (text.length > MAX_FEEDBACK_LENGTH) {
//       await ctx.reply(MESSAGES.tooLong)
//       return
//     }
    
//     ctx.wizard.state.improvementFeedback = text
    
//     await ctx.telegram.editMessageText(
//       ctx.chat.id,
//       ctx.wizard.state.feedbackMessageId,
//       null,
//       MESSAGES.improvementConfirm
//     )

//     const count = await Feedback.countDocuments({ userId: ctx.from.id })
//     if (count >= MAX_FEEDBACKS_PER_USER) {
//       await ctx.reply(MESSAGES.maxReached)
//       return ctx.scene.leave()
//     }

//     const feedback = new Feedback({
//       userId: ctx.from.id,
//       username: ctx.from.username || ctx.from.first_name,
//       trainingHours: ctx.wizard.state.trainingHours,
//       enjoymentRating: ctx.wizard.state.enjoymentRating,
//       improvementFeedback: ctx.wizard.state.improvementFeedback
//     })
    
//     try {
//       await feedback.save()
//       await ctx.reply(MESSAGES.thankYou)
//     } catch (err) {
//       console.error('Error saving feedback:', err)
//       await ctx.reply(MESSAGES.error)
//     }
    
//     return ctx.scene.leave()
//   }
// )

// // Handle rating button clicks
// feedbackWizard.action(/^rating_(\d+)$/, async (ctx: any) => {
//   const rating = parseInt(ctx.match[1], 10)
  
//   if (isNaN(rating) || rating < 1 || rating > 10) {
//     await ctx.answerCbQuery(MESSAGES.invalidRating)
//     return
//   }
  
//   await ctx.telegram.editMessageText(
//     ctx.chat.id,
//     ctx.wizard.state.buttonMessageId,
//     null,
//     MESSAGES.enjoymentRatingConfirm(rating)
//   )
  
//   ctx.wizard.state.enjoymentRating = rating
//   await ctx.wizard.steps[ctx.wizard.cursor](ctx)
// })

// // Handle cancel button
// feedbackWizard.action('exit_wizard', async (ctx: any) => {
//   await ctx.editMessageReplyMarkup({ reply_markup: { inline_keyboard: [] } })
//   await ctx.reply(MESSAGES.canceled)
//   return ctx.scene.leave()
// })