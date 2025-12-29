export const escapeMarkdownV2 = (text: string) => {
  return text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&')
}

export function formatConfirmationMessage(userData: any) {
  const escapedFirstName = escapeMarkdownV2(userData.firstName || 'N/A')
  const escapedLastName = escapeMarkdownV2(userData.lastName || 'N/A')
  const escapedUsername = escapeMarkdownV2(userData.username)
  const escapedGuild = escapeMarkdownV2(userData.guild)
  const escapedTelegramId = escapeMarkdownV2(userData.telegramId)

  return (
    `📋 *Profile Confirmation*\n\n` +
    `You are about to create a profile with the following information:\n\n` +
    `👤 *First Name:* ${escapedFirstName}\n` +
    `👤 *Last Name:* ${escapedLastName}\n` +
    `🔖 *Username:* @${escapedUsername}\n` +
    `🏰 *Guild:* ${escapedGuild}\n` +
    `🆔 *Telegram ID:* ${escapedTelegramId}\n\n` +
    `*What will be stored:*\n` +
    `• Your Telegram ID \\(for account identification\\)\n` +
    `• Your username and name \\(for leaderboards\\)\n` +
    `• Your guild affiliation\n` +
    `• Your activity logs and points\n\n` +
    `Do you want to proceed with registration?`
  )
}