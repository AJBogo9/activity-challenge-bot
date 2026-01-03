import { Scenes } from 'telegraf'
import { findUserByTelegramId } from '../../db'

// This scene checks if user is registered and routes to appropriate menu
export const menuRouterScene = new Scenes.BaseScene<any>('menu_router')

menuRouterScene.enter(async (ctx: any) => {
  try {
    const user = await findUserByTelegramId(ctx.from.id.toString())
    
    if (user) {
      // User is registered - go to registered menu
      await ctx.scene.enter('registered_menu')
    } else {
      // User is not registered - go to unregistered menu
      await ctx.scene.enter('unregistered_menu')
    }
  } catch (error) {
    console.error('Error checking user registration:', error)
    // Default to unregistered menu on error
    await ctx.scene.enter('unregistered_menu')
  }
})