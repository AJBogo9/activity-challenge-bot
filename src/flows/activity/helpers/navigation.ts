import { TwoMessageManager } from '../../../utils/two-message-manager'

/**
 * Cancel the wizard and return to main menu
 * Cleans up any temporary messages and reinitializes the two-message system
 */
export async function handleCancel(ctx: any): Promise<void> {
  // Delete the user's message to keep chat clean
  await TwoMessageManager.deleteUserMessage(ctx)
  
  // Return to registered menu (which will reinitialize the two-message system)
  await ctx.scene.enter('registered_menu')
}