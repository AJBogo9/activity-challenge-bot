// import { Scenes, Markup } from 'telegraf'
// import validateTeamName from '../../utils/validate-team-name'
// import { texts } from '../../utils/texts'
// import { findUserByTelegramId, updateUserTeam } from '../../db/users'
// import { createTeam, findTeamByName, updateTeamPoints, getTeamMembers, deleteTeam } from '../../db/teams'

// const cancelAndExitKeyboard = Markup.inlineKeyboard([
//   Markup.button.callback('Cancel', 'cancel')
// ])

// export const createTeamWizard = new Scenes.WizardScene(
//   'create_team_wizard',
//   async (ctx: any) => {
//     const user = await findUserByTelegramId(ctx.from.id.toString())

//     if (!user) {
//       await ctx.reply('User not found. Please /register first.')
//       return ctx.scene.leave()
//     }

//     if (user.team_id) {
//       const sentMessage = await ctx.reply(
//         'You are currently part of a team. By creating a new team, you will automatically leave your current team. ' +
//         'If your current team is left with no members, it will be permanently removed. ' +
//         'Do you wish to continue?',
//         Markup.inlineKeyboard([
//           Markup.button.callback('Yes, create new team', 'confirm_create_team'),
//           Markup.button.callback('No, cancel', 'cancel_create_team')
//         ])
//       )
//       ctx.wizard.state.questionMessageId = sentMessage.message_id
//       return ctx.wizard.next()
//     } else {
//       const sentMessage = await ctx.reply('Please provide a name for your new team.', cancelAndExitKeyboard)
//       ctx.wizard.state.questionMessageId = sentMessage.message_id
//       ctx.wizard.state.confirmCreate = true
//       return ctx.wizard.next()
//     }
//   },
//   async (ctx: any) => {
//     if (ctx.wizard.state.confirmCreate) {
//       const teamName = ctx.message.text
//       const validation = validateTeamName(teamName)

//       if (!validation.isValid) {
//         await ctx.telegram.editMessageText(ctx.chat.id, ctx.wizard.state.questionMessageId, null, 'Please provide a name for your new team.')
//         const sentMessage = await ctx.reply(validation.reason, cancelAndExitKeyboard)
//         ctx.wizard.state.questionMessageId = sentMessage.message_id
//         return ctx.wizard.selectStep(ctx.wizard.cursor)
//       }

//       try {
//         await ctx.telegram.editMessageText(ctx.chat.id, ctx.wizard.state.questionMessageId, null, 'Please provide a name for your new team.')
//         const user = await findUserByTelegramId(ctx.from.id.toString())
//         if (!user) throw new Error("User not found")
        
//         // Check if team name already exists
//         const existingTeam = await findTeamByName(teamName)
//         if (existingTeam) {
//           await ctx.reply('A team with that name already exists. Please try a different name.')
//           await ctx.scene.leave()
//           return ctx.scene.enter('create_team_wizard')
//         }

//         // Create the team
//         const team = await createTeam(teamName, user.guild!)
        
//         // Add user to the new team
//         await updateUserTeam(ctx.from.id.toString(), team.id)
        
//         // Update team points
//         await updateTeamPoints(team.id)

//         await ctx.reply('Team has been successfully created! Other members can join your team using this ID:')
//         await ctx.reply(`${team.id}`)
//         return ctx.scene.leave()
//       } catch (error: any) {
//         console.error('Error creating team:', error)
//         await ctx.reply(texts.actions.error.error)
//         return ctx.scene.leave()
//       }
//     } else {
//       await ctx.telegram.editMessageText(ctx.chat.id, ctx.wizard.state.questionMessageId, null, 'Please provide a name for your new team.')
//       await ctx.reply('Team creation canceled. Start again with /createteam.')
//       return ctx.scene.leave()
//     }
//   }
// )

// createTeamWizard.action('confirm_create_team', async (ctx: any) => {
//   ctx.wizard.state.confirmCreate = true
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
  
//   const sentMessage = await ctx.editMessageText('Please provide a name for your new team.', cancelAndExitKeyboard)
//   ctx.wizard.state.questionMessageId = sentMessage.message_id
// })

// createTeamWizard.action('cancel_create_team', async (ctx: any) => {
//   ctx.wizard.state.confirmCreate = false
//   await ctx.editMessageText('Team creation canceled. Start again with /createteam.')
//   return ctx.scene.leave()
// })

// createTeamWizard.action('cancel', async (ctx: any) => {
//   await ctx.editMessageText('Team creation canceled. Start again with /createteam.')
//   return ctx.scene.leave()
// })