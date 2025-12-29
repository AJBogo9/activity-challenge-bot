import { Scenes, Markup } from 'telegraf'
import { createUser, findUserByTelegramId, getGuildNames } from '../db'
import { ERROR_MESSAGE, TERMS_AND_CONDITIONS } from '../utils/texts'

export const registerWizard = new Scenes.WizardScene(
  'register_wizard',
  // Step 1: Check if user exists and show terms
  async (ctx: any) => {
    const user = await findUserByTelegramId(ctx.from.id.toString())

    if (user) {
      await ctx.reply(
        "You've already registered! You can start logging activities with /sportsactivity.",
        Markup.keyboard([['⬅️ Back to Main Menu']])
          .resize()
          .persistent()
      )
      return ctx.scene.enter('unregistered_menu')
    }

    await ctx.reply(
      TERMS_AND_CONDITIONS,
      Markup.inlineKeyboard([
        [Markup.button.callback('✅ Accept', 'accept_terms')],
        [Markup.button.callback('❌ Decline', 'decline_terms')]
      ])
    )

    return ctx.wizard.next()
  }
)

// Handle accept terms
registerWizard.action('accept_terms', async (ctx: any) => {
  await ctx.editMessageText('✅ You accepted the terms and conditions.')

  // Create guild selection buttons
  const guilds = await getGuildNames()
  const guildButtons = guilds.map((g: string) =>
    Markup.button.callback(g, `select_guild_${g}`)
  )

  // Arrange buttons in rows of 3
  const guildRows = []
  for (let i = 0; i < guildButtons.length; i += 3) {
    guildRows.push(guildButtons.slice(i, i + 3))
  }

  // Balance the last row if needed
  if (guildRows.length > 1 && guildRows[guildRows.length - 1].length < 3) {
    const lastRow = guildRows.pop()
    const prevRow = guildRows.pop()

    if (lastRow && prevRow) {
      const combined = prevRow.concat(lastRow)
      if (combined.length <= 5) {
        guildRows.push(combined)
      } else {
        const total = combined.length
        let splitIndex = Math.floor(total / 2)
        if (splitIndex < 3) {
          splitIndex = 3
        }
        if (total - splitIndex < 3) {
          splitIndex = total - 3
        }
        const firstPart = combined.slice(0, splitIndex)
        const secondPart = combined.slice(splitIndex)
        guildRows.push(firstPart)
        guildRows.push(secondPart)
      }
    }
  }

  guildRows.push([Markup.button.callback('❌ Cancel', 'cancel_registration')])

  await ctx.reply('Please select your guild:', Markup.inlineKeyboard(guildRows))
})

// Handle decline terms
registerWizard.action('decline_terms', async (ctx: any) => {
  await ctx.editMessageReplyMarkup({ inline_keyboard: [] })
  await ctx.reply(
    'You did not accept the terms and conditions necessary to enter the competition.\n\nYou can try again from the main menu.',
    Markup.keyboard([['⬅️ Back to Main Menu']])
      .resize()
      .persistent()
  )
  return ctx.scene.enter('unregistered_menu')
})

// Handle guild selection
registerWizard.action(/^select_guild_(.+)$/, async (ctx: any) => {
  const guild = ctx.match[1]

  const firstName = ctx.from.first_name || ''
  const lastName = ctx.from.last_name || ''
  const username = ctx.from.username || `user_${ctx.from.id}`

  try {
    await createUser({
      telegramId: ctx.from.id.toString(),
      username: username,
      firstName: firstName,
      lastName: lastName,
      guild: guild,
    })

    await ctx.editMessageReplyMarkup({ inline_keyboard: [] })
    await ctx.reply(
      `🎉 Success! You're now registered to the *${guild}* guild!\n\n` +
      `You can now:\n` +
      `• Log activities with /sportsactivity\n` +
      `• View your stats with /summary\n` +
      `• Check leaderboards with /leaderboards\n\n` +
      `If you selected the wrong guild, use /deleteuser to start over.`,
      { parse_mode: 'Markdown' }
    )

    // Go to registered user menu
    return ctx.scene.enter('registered_menu')
  } catch (error) {
    console.error('Error creating user:', error)
    await ctx.editMessageText(ERROR_MESSAGE)
    await ctx.reply(
      'There was an error during registration. Please try again.',
      Markup.keyboard([['⬅️ Back to Main Menu']])
        .resize()
        .persistent()
    )
    return ctx.scene.enter('unregistered_menu')
  }
})

// Handle cancel
registerWizard.action('cancel_registration', async (ctx: any) => {
  await ctx.editMessageText('❌ Registration cancelled.')
  await ctx.reply(
    'You can start registration again from the main menu.',
    Markup.keyboard([['⬅️ Back to Main Menu']])
      .resize()
      .persistent()
  )
  return ctx.scene.enter('unregistered_menu')
})