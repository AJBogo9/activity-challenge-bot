import { Scenes, Markup } from 'telegraf'
import * as userService from '../services/user-service'
import * as teamService from '../services/team-service'
import texts from '../utils/texts'
import { isNotCallback } from '../utils/flow-helpers'

export const deleteUserWizard = new Scenes.WizardScene(
  'delete_user_wizard',
  async (ctx: any) => {
    const userId = ctx.from.id
    const user = await userService.findUser(userId)

    if (!user) {
      await ctx.reply('User not found. Please /register first.')
      return ctx.scene.leave()
    }

    await ctx.reply(
      'Confirm user deletion? This action will also remove the user from their current team and, if it results in an empty team, delete the team as well. This cannot be undone.',
      Markup.inlineKeyboard([
        Markup.button.callback('Yes, delete', 'confirm_delete'),
        Markup.button.callback('No, cancel', 'cancel_delete')
      ])
    )
    return ctx.wizard.next()
  },
  async (ctx: any) => {
    if (await isNotCallback(ctx)) return
  }
)

deleteUserWizard.action('confirm_delete', async (ctx: any) => {
  const user = await userService.findUser(ctx.from.id)
  try {
    if (user && user.team) {
      await teamService.leaveTeam(user._id, user.team)
    }
    const deletionResult = await userService.deleteUser(ctx.from.id)
    if (!deletionResult) {
      await ctx.editMessageText('User not found or already deleted.')
    } else {
      await ctx.editMessageText('User deleted. You can register again using /register.')
    }
  } catch (error) {
    await ctx.reply(texts.actions.error.error)
    console.error(error)
  }
  return ctx.scene.leave()
})

deleteUserWizard.action('cancel_delete', async (ctx: any) => {
  await ctx.editMessageText('Deletion canceled.')
  return ctx.scene.leave()
})

