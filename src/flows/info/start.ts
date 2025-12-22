import { Scenes } from 'telegraf'
import { escapeMarkdown } from '../../utils/format-list'
import { INSTRUCTIONS_MESSAGE, WELCOME_MESSAGE } from '../../utils/texts'

export const startWizard = new Scenes.WizardScene(
  'start_wizard',
  async (ctx: any) => {
    await ctx.replyWithMarkdownV2(escapeMarkdown(WELCOME_MESSAGE))
    await ctx.replyWithMarkdownV2(escapeMarkdown(INSTRUCTIONS_MESSAGE))
    
    // Route to appropriate menu based on registration status
    await ctx.scene.enter('menu_router')
  }
)
