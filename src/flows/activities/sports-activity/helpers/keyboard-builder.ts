import type { MainCategories } from '../types'

export function createKeyboard(items: string[], includeBack: boolean = false): string[][] {
  const keyboard: string[][] = []
  
  // If 3 or fewer items, use single column
  if (items.length <= 3) {
    items.forEach(item => keyboard.push([item]))
  } else {
    // Use 2-column layout for more than 3 items
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

export function addMetValuesToIntensities(
  intensities: string[],
  mainCategory: string,
  subcategory: string,
  activity: string,
  hierarchy: MainCategories
): string[] {
  return intensities.map(intensity => {
    const metValue = hierarchy[mainCategory]?.[subcategory]?.[activity]?.[intensity]?.[0]?.met_value || 0
    return `${intensity} (${metValue} MET)`
  })
}

export function extractIntensityFromLabel(label: string): string {
  const match = label.match(/^(.+?)\s*\([\d.]+\s*MET\)$/)
  return match ? match[1] : label
}