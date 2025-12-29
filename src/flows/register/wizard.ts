import { Scenes } from 'telegraf'
import { showTermsStep, handleTermsResponse } from './steps/1-terms'
import { handleGuildSelection } from './steps/2-guild'
import { handleConfirmation } from './steps/3-confirm'

// Wizard state interface for type safety
interface RegisterWizardState {
  pendingUser?: {
    telegramId: string
    username: string
    firstName: string
    lastName: string
    guild: string
  }
}

export const registerWizard = new Scenes.WizardScene<any>(
  'register_wizard',
  
  // Step 0: Show Terms & Conditions
  async (ctx: any) => {
    await showTermsStep(ctx)
    return ctx.wizard.next()
  },

  // Step 1: Handle Terms Response → Show Guild Selection
  async (ctx: any) => {
    const accepted = await handleTermsResponse(ctx)
    if (!accepted) {
      // User declined or already registered
      return
    }

    return ctx.wizard.next()
  },

  // Step 2: Handle Guild Selection → Show Confirmation
  async (ctx: any) => {
    const selected = await handleGuildSelection(ctx)
    if (!selected || !ctx.wizard.state.pendingUser) {
      // Wait for valid guild selection
      return
    }

    return ctx.wizard.next()
  },

  // Step 3: Handle Confirmation → Create User
  async (ctx: any) => {
    await handleConfirmation(ctx)
  }
)