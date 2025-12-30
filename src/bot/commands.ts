import { bot } from './instance'

export function registerCommands() {
  // Start command - entry point when user first opens bot
  bot.start((ctx: any) => ctx.scene.enter('menu_router'))
}