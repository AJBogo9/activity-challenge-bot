import { Scenes } from 'telegraf'

let cachedContributors = '- Andreas Bogossian\n- Tomi Lahti'

export async function initializeContributors() {
  try {
    const response = await fetch('https://api.github.com/repos/AJBogo9/activity-challenge-bot/contributors')
    const contributors = await response.json()
    cachedContributors = contributors
      .map((c: any) => `- ${c.login}`)
      .join('\n')
  } catch (error) {
    console.error('Failed to fetch contributors:', error)
  }
}

export const creditsScene = new Scenes.BaseScene<any>('credits')

creditsScene.enter(async (ctx: any) => {
  const message = `👥 *Credits*

*Project Contributors*
This bot was created by:
${cachedContributors}

Special thanks to all the guilds and participants who made this competition possible!

Built with ❤️ for the Aalto sports community`

  await ctx.replyWithMarkdown(message)
  await ctx.scene.enter('info_menu')
})

creditsScene.on('text', async (ctx: any) => {
  await ctx.scene.leave()
  await ctx.scene.enter('info_menu')
})