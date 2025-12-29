import { Markup } from 'telegraf'

export function createGuildButtons(guilds: string[]) {
  const guildButtons = guilds.map((g: string) =>
    Markup.button.callback(g, `select_guild_${g}`)
  )

  // Arrange buttons in rows of 3
  const guildRows: any[] = []
  for (let i = 0; i < guildButtons.length; i += 3) {
    guildRows.push(guildButtons.slice(i, i + 3))
  }

  // Balance the last row if needed
  if (guildRows.length > 1 && guildRows[guildRows.length - 1].length < 3) {
    const lastRow = guildRows.pop()!
    const prevRow = guildRows.pop()!
    const combined = prevRow.concat(lastRow)
    
    if (combined.length <= 5) {
      guildRows.push(combined)
    } else {
      const total = combined.length
      const splitIndex = Math.max(3, Math.min(Math.floor(total / 2), total - 3))
      guildRows.push(combined.slice(0, splitIndex))
      guildRows.push(combined.slice(splitIndex))
    }
  }

  guildRows.push([Markup.button.callback('❌ Cancel', 'cancel_registration')])

  return guildRows
}