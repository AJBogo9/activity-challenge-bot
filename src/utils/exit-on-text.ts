const exitOnText = async (ctx: any, startOverCmd: string) => {
  if (ctx.message && 'text' in ctx.message) {
    await ctx.reply(`This question should be answered using the buttons. Please start over with ${startOverCmd}`)
    return true
  }
  return false
}

export default exitOnText