// import { Scenes, Markup } from 'telegraf'
// import { isNotCallback } from '../../utils/flow-helpers'
// import { texts } from '../../utils/texts'
// import { findUserByTelegramId, updateUserTeam } from '../../db/users'
// import { findTeamById, updateTeamPoints, getTeamMembers, deleteTeam } from '../../db/teams'

// const cancelAndExitKeyboard = Markup.inlineKeyboard([
//   Markup.button.callback('Cancel', 'cancel')
// ])

// export const joinTeamWizard = new Scenes.WizardScene(
//   'join_team_wizard',
//   async (ctx: any) => {
//     const userId = ctx.from.id.toString()
//     const user = await findUserByTelegramId(userId)
    
//     if (!user) {
//       await ctx.reply('User not found. Please /register first.')
//       return ctx.scene.leave()
//     }

//     if (user.team_id) {
//       await ctx.reply(
//         'You are already part of a team. By joining a new team, you will automatically leave your current team. ' +
//         'If your current team is left with no members, it will be permanently removed. ' +
//         'Do you wish to continue?',
//         Markup.inlineKeyboard([
//           Markup.button.callback('Yes, join new team', 'confirm_join_team'),
//           Markup.button.callback('No, cancel', 'cancel')
//         ])
//       )
//       return ctx.wizard.next()
//     } else {
//       ctx.wizard.state.confirmJoin = true
//       const sentMessage = await ctx.reply('Please enter the ID of the team you wish to join. This ID was provided when the team was initially created.', cancelAndExitKeyboard)
//       ctx.wizard.state.questionMessageId = sentMessage.message_id
//       return ctx.wizard.next()
//     }
//   },
//   async (ctx: any) => {
//     if (ctx.wizard.state.confirmJoin) {
//       if ('text' in ctx.message) {
//         const teamIdStr = ctx.message.text.trim()
//         const userId = ctx.from.id.toString()
//         const user = await findUserByTelegramId(userId)

//         if (!teamIdStr) {
//           await ctx.reply('No team ID provided. Please provide a valid team ID.')
//           return ctx.wizard.selectStep(ctx.wizard.cursor)
//         }

//         // Parse team ID as integer
//         const teamId = parseInt(teamIdStr, 10)
        
//         if (isNaN(teamId)) {
//           await ctx.telegram.editMessageText(ctx.chat.id, ctx.wizard.state.questionMessageId, null, 'Please enter the ID of the team you wish to join.')
//           await ctx.reply('Invalid team ID format. Please enter a numeric team ID.')
//           await ctx.scene.leave()
//           return ctx.scene.enter('join_team_wizard')
//         }

//         try {
//           const team = await findTeamById(teamId)
          
//           if (!team) {
//             await ctx.telegram.editMessageText(ctx.chat.id, ctx.wizard.state.questionMessageId, null, 'Please enter the ID of the team you wish to join.')
//             await ctx.reply('No team found with the provided ID. Please check the ID and try again.')
//             await ctx.scene.leave()
//             return ctx.scene.enter('join_team_wizard')
//           }

//           // Check if user's guild matches team's guild
//           if (user && user.guild !== team.guild) {
//             await ctx.telegram.editMessageText(ctx.chat.id, ctx.wizard.state.questionMessageId, null, 'Please enter the ID of the team you wish to join.')
//             await ctx.reply(`You cannot join this team. This team belongs to ${team.guild} guild, but you are in ${user.guild} guild.`)
//             return ctx.scene.leave()
//           }

//           if (user) {
//             // Add user to new team
//             await updateUserTeam(userId, teamId)
            
//             // Update new team points
//             await updateTeamPoints(teamId)
//           }

//           await ctx.telegram.editMessageText(ctx.chat.id, ctx.wizard.state.questionMessageId, null, 'Please enter the ID of the team you wish to join.')
//           await ctx.reply(`Successfully joined team ${team.name}!`)
//           return ctx.scene.leave()
//         } catch (err) {
//           console.error('Error joining team:', err)
//           await ctx.telegram.editMessageText(ctx.chat.id, ctx.wizard.state.questionMessageId, null, 'Please enter the ID of the team you wish to join.')
//           await ctx.reply('An error occurred while joining the team. Please try again.')
//           return ctx.scene.leave()
//         }
//       } else {
//         await ctx.reply('Please enter the team ID.', cancelAndExitKeyboard)
//         return ctx.wizard.selectStep(ctx.wizard.cursor)
//       }
//     } else {
//       if (await isNotCallback(ctx)) return
//       ctx.reply(texts.actions.error.error)
//       return ctx.scene.leave()
//     }
//   }
// )

// joinTeamWizard.action('confirm_join_team', async (ctx: any) => {
//   ctx.wizard.state.confirmJoin = true
//   const userId = ctx.from.id.toString()
//   const user = await findUserByTelegramId(userId)
  
//   if (user && user.team_id) {
//     const oldTeamId = user.team_id
    
//     // Remove user from old team
//     await updateUserTeam(userId, null)
    
//     // Check if old team is now empty and delete if so
//     const remainingMembers = await getTeamMembers(oldTeamId)
//     if (remainingMembers.length === 0) {
//       await deleteTeam(oldTeamId)
//     } else {
//       // Update old team points
//       await updateTeamPoints(oldTeamId)
//     }
//   }
  
//   await ctx.editMessageReplyMarkup({})
//   const sentMessage = await ctx.reply('Please enter the ID of the team you wish to join.', cancelAndExitKeyboard)
//   ctx.wizard.state.questionMessageId = sentMessage.message_id
// })

// joinTeamWizard.action('cancel', async (ctx: any) => {
//   ctx.wizard.state.confirmJoin = false
//   await ctx.editMessageText('Joining team canceled. Start again with /jointeam.')
//   return ctx.scene.leave()
// })