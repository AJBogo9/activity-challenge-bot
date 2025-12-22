import { Scenes, Markup } from 'telegraf'
import { isNotCallback } from '../../utils/flow-helpers'
import { adjustUserPoints } from '../../db/point-queries'
import { findUserByUsername } from '../../db/users'
import { adminIds } from '../../config/constants'

export const adjustPointsWizard = new Scenes.WizardScene(
  'adjust_points_wizard',
  async (ctx: any) => {
    const currentAdmin = String(ctx.from.id)
    if (!adminIds.includes(currentAdmin)) {
      await ctx.reply("You are not authorized to perform this action.")
      return ctx.scene.leave()
    }
    const sentMessage = await ctx.replyWithMarkdownV2(
      "*Admin Mode*:\nPlease enter the username of the user whose points you want to adjust:",
      Markup.inlineKeyboard([
        Markup.button.callback("Cancel & Exit", "exit_wizard")
      ])
    )
    ctx.wizard.state.startMessageId = sentMessage.message_id
    return ctx.wizard.next()
  },
  async (ctx: any) => {
    const targetUsername = ctx.message.text.trim()
    ctx.wizard.state.targetUsername = targetUsername
    
    const targetUser = await findUserByUsername(targetUsername)
    
    if (!targetUser) {
      await ctx.telegram.editMessageText(
        ctx.chat.id, 
        ctx.wizard.state.startMessageId, 
        null, 
        `Please enter the username of the user whose points you want to adjust:`
      )
      await ctx.reply("User not found. Start again using /adjustpoints.")
      return ctx.scene.leave()
    }
    
    await ctx.telegram.editMessageText(
      ctx.chat.id, 
      ctx.wizard.state.startMessageId, 
      null, 
      `Please enter the username of the user whose points you want to adjust: ${targetUser.username} (${targetUser.first_name || 'N/A'}) selected`
    )
    
    const sentMessage = await ctx.reply(
      "Please enter the number of points to adjust (positive to add, negative to subtract):",
      Markup.inlineKeyboard([
        Markup.button.callback("Cancel & Exit", "exit_wizard")
      ])
    )
    ctx.wizard.state.questionMessageId = sentMessage.message_id
    return ctx.wizard.next()
  },
  async (ctx: any) => {
    const input = ctx.message.text.trim()
    const pointsDelta = parseInt(input, 10)
    
    if (isNaN(pointsDelta)) {
      await ctx.telegram.editMessageText(
        ctx.chat.id, 
        ctx.wizard.state.questionMessageId, 
        null, 
        `Please enter the number of points to adjust (positive to add, negative to subtract):`
      )
      await ctx.reply("Invalid input. Please enter a valid numeric value.")
      return ctx.wizard.selectStep(ctx.wizard.cursor)
    }
    
    await ctx.telegram.editMessageText(
      ctx.chat.id, 
      ctx.wizard.state.questionMessageId, 
      null, 
      `Please enter the number of points to adjust (positive to add, negative to subtract): ${pointsDelta} selected`
    )
    
    ctx.wizard.state.pointsDelta = pointsDelta
    
    const action = pointsDelta > 0 ? 'add' : 'subtract'
    const absPoints = Math.abs(pointsDelta)
    
    await ctx.reply(
      `You are about to ${action} ${absPoints} points ${pointsDelta > 0 ? 'to' : 'from'} ${ctx.wizard.state.targetUsername}'s account. Confirm?`,
      Markup.inlineKeyboard([
        [Markup.button.callback("Confirm", "confirm_adjust"), Markup.button.callback("Cancel & Exit", "exit_wizard")]
      ])
    )
    return ctx.wizard.next()
  },
  async (ctx: any) => {
    if (await isNotCallback(ctx)) return

    await ctx.answerCbQuery()
    
    if (ctx.callbackQuery.data === 'confirm_adjust') {
      try {
        await adjustUserPoints(
          ctx.wizard.state.targetUsername,
          ctx.wizard.state.pointsDelta
        )
        
        const action = ctx.wizard.state.pointsDelta > 0 ? 'added to' : 'subtracted from'
        const absPoints = Math.abs(ctx.wizard.state.pointsDelta)
        
        await ctx.editMessageText(
          `Successfully ${action} ${absPoints} points ${ctx.wizard.state.pointsDelta > 0 ? 'to' : 'from'} ${ctx.wizard.state.targetUsername}'s account.`
        )
      } catch (error: any) {
        console.error('Error adjusting points:', error)
        await ctx.editMessageText(`Error adjusting points: ${error.message}`)
      }
    } else {
      await ctx.editMessageText("Adjustment cancelled.")
    }
    return ctx.scene.leave()
  }
)

adjustPointsWizard.action('exit_wizard', async (ctx: any) => {
  await ctx.editMessageReplyMarkup({})
  await ctx.reply("Canceled & Exited. You can start again using /adjustpoints.")
  return ctx.scene.leave()
})