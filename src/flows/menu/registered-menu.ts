// src/flows/menu/registered-menu.ts
import { Scenes, Markup } from 'telegraf'
import { PersistentMenu } from '../../utils/persistent-menu'

export const registeredMenuScene = new Scenes.BaseScene<any>('registered_menu')

registeredMenuScene.enter(async (ctx: any) => {
  const message = '🏠 *Main Menu*\n\nWhat would you like to do?'
  await ctx.replyWithMarkdown(
    message,
    Markup.keyboard([
      ['👤 Profile', '💪 Log Activity'],
      ['📊 Statistics', 'ℹ️ Info'],
      ['💬 Feedback']
    ])
      .resize()
      .persistent()
  )
})

// Register reply keyboard handlers with automatic message deletion
PersistentMenu.registerReplyKeyboardHandlers(registeredMenuScene, 'registered_menu')

// Handle any other text input
registeredMenuScene.on('text', async (ctx: any) => {
  await ctx.reply('Please use the buttons below to navigate the menu.')
})