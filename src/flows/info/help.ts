import { Scenes } from 'telegraf'
import { escapeMarkdown } from '../../utils/format-list'
import { GROUP_CHAT_HELP, PRIVATE_CHAT_HELP } from '../../utils/texts'

export const helpScene = new Scenes.BaseScene<any>('help_scene')

helpScene.enter(async (ctx: any) => {
  const isPrivateChat = ctx.update.message?.chat.type === 'private' || 
                        ctx.chat?.type === 'private'
  
  const helpMessage = isPrivateChat ? PRIVATE_CHAT_HELP : GROUP_CHAT_HELP
  
  await ctx.replyWithMarkdownV2(escapeMarkdown(helpMessage))
  
  // Return to info menu after showing help
  await ctx.scene.enter('info_menu')
})