import { Scenes } from 'telegraf'
import { WELCOME_MESSAGE } from '../utils/texts'

export const startWizard = new Scenes.WizardScene(
  'start_wizard',
  async (ctx: any) => {
    await ctx.replyWithMarkdownV2(WELCOME_MESSAGE)
    
    // Route to appropriate menu based on registration status
    await ctx.scene.enter('menu_router')
  }
)