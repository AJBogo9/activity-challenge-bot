import { Scenes } from 'telegraf'

export const creditsScene = new Scenes.BaseScene<any>('credits')

creditsScene.enter(async (ctx: any) => {
  const message = `👥 *Credits*

*Project Contributors*

This bot was created by:

- Andreas Bogossian
- Eppu Ruotsalainen
- Tomi Lahti

Special thanks to all the guilds and participants who made this competition possible!

Built with ❤️ for the Aalto sports community`

  await ctx.replyWithMarkdown(message)
  await ctx.scene.enter('info_menu')
})

// Auto-leave scene after displaying credits
creditsScene.on('text', async (ctx: any) => {
  await ctx.scene.leave()
  await ctx.scene.enter('info_menu')
})