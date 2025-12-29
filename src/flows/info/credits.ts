import { Scenes, Markup } from 'telegraf'

let cachedContributors = '- Andreas Bogossian\n- Tomi Lahti'
let lastFetchTime = 0
const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours in milliseconds

export async function initializeContributors() {
  const now = Date.now()
  
  // Check if cache is still valid (less than 24 hours old)
  if (now - lastFetchTime < CACHE_DURATION && cachedContributors !== '- Andreas Bogossian\n- Tomi Lahti') {
    console.log('Using cached contributors (still fresh)')
    return
  }

  try {
    console.log('Fetching contributors from GitHub API...')
    const response = await fetch('https://api.github.com/repos/AJBogo9/activity-challenge-bot/contributors')
    
    if (!response.ok) {
      throw new Error(`GitHub API returned ${response.status}`)
    }
    
    const contributors = await response.json()
    
    // Filter out bots
    const realContributors = contributors.filter((c: any) => c.type !== 'Bot')
    
    // Fetch full names for each contributor
    const contributorNames = await Promise.all(
      realContributors.map(async (c: any) => {
        try {
          const userResponse = await fetch(c.url)
          if (!userResponse.ok) {
            return c.login // Fallback to username
          }
          const userData = await userResponse.json()
          // Use full name if available, otherwise use username
          return userData.name || c.login
        } catch (error) {
          console.error(`Failed to fetch user data for ${c.login}:`, error)
          return c.login // Fallback to username on error
        }
      })
    )
    
    cachedContributors = contributorNames
      .map(name => `- ${name}`)
      .join('\n')
    
    lastFetchTime = now
    console.log(`Contributors cached successfully (${contributorNames.length} contributors, bots filtered out)`)
  } catch (error) {
    console.error('Failed to fetch contributors:', error)
    // Keep using cached/default contributors on error
  }
}

export const creditsScene = new Scenes.BaseScene<any>('credits')

creditsScene.enter(async (ctx: any) => {
  // Refresh contributors if cache is stale
  await initializeContributors()
  
  const message = `👥 *Credits*

*Project Contributors*

${cachedContributors}

Special thanks to all the guilds and participants who made this competition possible!

Built with ❤️ for the Aalto sports community`

  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback('⬅️ Back to Info Menu', 'credits:back')]
  ])

  if (ctx.callbackQuery) {
    await ctx.editMessageText(message, {
      parse_mode: 'Markdown',
      ...keyboard
    })
    await ctx.answerCbQuery()
  } else {
    await ctx.replyWithMarkdown(message, keyboard)
  }
})

creditsScene.action('credits:back', async (ctx: any) => {
  await ctx.answerCbQuery()
  await ctx.scene.enter('info_menu')
})