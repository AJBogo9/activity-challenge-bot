export async function isNotCallback(ctx: any) {
  if (ctx.updateType === 'message') {
    await ctx.reply('Please use the provided buttons to select an activity.')
    return true
  }
  return false
}