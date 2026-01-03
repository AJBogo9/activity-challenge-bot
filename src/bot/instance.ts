import { Telegraf, Scenes } from 'telegraf';
import https from 'https';
import { botConfig } from '../config';

type MyContext = Scenes.SceneContext;

const agent = new https.Agent({ keepAlive: botConfig.keepAlive });
export const bot = new Telegraf<MyContext>(botConfig.token, { telegram: { agent } });

// Block all non-private chats
bot.use(async (ctx, next) => {
  // Only allow private chats (DMs)
  if (ctx.chat?.type !== 'private') {
    // Don't try to send messages for my_chat_member events (when bot is added/kicked)
    if (ctx.updateType === 'my_chat_member') {
      return;
    }
    // Try to send warning message, but ignore errors if bot was kicked
    try {
      await ctx.reply('⚠️ This bot only works in private messages. Please message me directly.');
    } catch (error) {
      // Silently ignore errors (bot was likely kicked or blocked)
    }
    return;
  }
  return next();
});