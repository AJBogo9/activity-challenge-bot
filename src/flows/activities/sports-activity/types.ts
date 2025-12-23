export interface ActivityData {
  met_value: number
  examples: string
}

export interface IntensityLevel {
  [intensity: string]: ActivityData[]
}

export interface Activities {
  [activity: string]: IntensityLevel
}

export interface Subcategories {
  [subcategory: string]: Activities
}

export interface MainCategories {
  [mainCategory: string]: Subcategories
}

export interface WizardState {
  mainCategory?: string
  subcategory?: string
  activity?: string
  intensity?: string
  metValue?: number
  activityDate?: string
  duration?: number
}