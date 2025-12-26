import { getMetValue } from './activity-data'

/**
 * Create a Telegram keyboard layout from an array of items
 * @param items - Array of button labels
 * @param includeBack - Whether to include back and cancel buttons
 * @returns 2D array representing keyboard rows and columns
 */
export function createKeyboard(items: string[], includeBack: boolean = false): string[][] {
  const keyboard: string[][] = []

  // Handle empty items
  if (items.length === 0) {
    console.warn('createKeyboard: No items provided')
    return includeBack ? [['⬅️ Back', '❌ Cancel']] : [['❌ Cancel']]
  }

  // Single column for 3 or fewer items
  if (items.length <= 3) {
    items.forEach(item => keyboard.push([item]))
  } 
  // Two-column layout for more items
  else {
    for (let i = 0; i < items.length; i += 2) {
      if (i + 1 < items.length) {
        keyboard.push([items[i], items[i + 1]])
      } else {
        keyboard.push([items[i]])
      }
    }
  }

  // Add navigation buttons
  if (includeBack) {
    keyboard.push(['⬅️ Back', '❌ Cancel'])
  } else {
    keyboard.push(['❌ Cancel'])
  }

  return keyboard
}

/**
 * Add MET values to intensity labels for display
 * @param intensities - Array of intensity names
 * @param mainCategory - The main category
 * @param subcategory - The subcategory
 * @param activity - The activity name
 * @returns Array of intensity labels with MET values appended
 * @example ["light", "moderate"] => ["light (3.0 MET)", "moderate (5.5 MET)"]
 */
export function addMetValuesToIntensities(
  intensities: string[],
  mainCategory: string,
  subcategory: string,
  activity: string
): string[] {
  return intensities.map(intensity => {
    const metValue = getMetValue(mainCategory, subcategory, activity, intensity)
    return `${intensity} (${metValue.toFixed(1)} MET)`
  })
}

/**
 * Extract the intensity name from a label that includes MET value
 * @param label - Label with MET value (e.g., "moderate (5.5 MET)")
 * @returns Intensity name without MET value (e.g., "moderate")
 */
export function extractIntensityFromLabel(label: string | undefined): string {
  if (!label) {
    return ''
  }

  // Match pattern: "intensity (X.X MET)"
  const match = label.match(/^(.+?)\s*\([\d.]+\s*MET\)$/)
  
  if (match && match[1]) {
    return match[1].trim()
  }

  // Return original if pattern doesn't match
  return label.trim()
}