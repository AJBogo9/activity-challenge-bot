import { ErrorMsg } from '../config/constants';

export const handleError = (ctx: any, error: any, customMessage: any) => {
  console.error(customMessage || 'Error:', error)
  if (ctx && ctx.reply) ctx.reply(customMessage || ErrorMsg)
}