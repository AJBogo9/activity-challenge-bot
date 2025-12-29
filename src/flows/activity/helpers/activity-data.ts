import activitiesData from '../../../../data/processed/4_level_hierarchy.json'

/**
 * Type definition for the 4-level activity hierarchy
 * Structure: MainCategory -> Subcategory -> Activity -> Intensity -> MetData[]
 */
type MetData = {
  met_value: number
  examples: string
}

type HierarchyData = Record<
  string, // Main Category
  Record<
    string, // Subcategory
    Record<
      string, // Activity
      Record<
        string, // Intensity
        MetData[]
      >
    >
  >
>

export const hierarchy = activitiesData as HierarchyData

/**
 * Get all main categories (top level)
 * @returns Array of main category names
 */
export function getMainCategories(): string[] {
  return Object.keys(hierarchy)
}

/**
 * Get all subcategories for a given main category
 * @param mainCategory - The main category
 * @returns Array of subcategory names
 */
export function getSubcategories(mainCategory: string): string[] {
  const category = hierarchy[mainCategory]
  return category ? Object.keys(category) : []
}

/**
 * Get all activities for a given category and subcategory
 * @param mainCategory - The main category
 * @param subcategory - The subcategory
 * @returns Array of activity names
 */
export function getActivities(mainCategory: string, subcategory: string): string[] {
  const activities = hierarchy[mainCategory]?.[subcategory]
  return activities ? Object.keys(activities) : []
}

/**
 * Get all intensity levels for a given activity
 * @param mainCategory - The main category
 * @param subcategory - The subcategory
 * @param activity - The activity name
 * @returns Array of intensity level names
 */
export function getIntensities(
  mainCategory: string,
  subcategory: string,
  activity: string
): string[] {
  const intensities = hierarchy[mainCategory]?.[subcategory]?.[activity]
  return intensities ? Object.keys(intensities) : []
}

/**
 * Get the MET (Metabolic Equivalent of Task) value for a specific activity and intensity
 * @param mainCategory - The main category
 * @param subcategory - The subcategory
 * @param activity - The activity name
 * @param intensity - The intensity level
 * @returns MET value, or 0 if not found
 */
export function getMetValue(
  mainCategory: string,
  subcategory: string,
  activity: string,
  intensity: string
): number {
  const metData = hierarchy[mainCategory]?.[subcategory]?.[activity]?.[intensity]?.[0]
  return metData?.met_value || 0
}

/**
 * Validate if a main category exists
 * @param category - Category to validate
 * @returns true if valid
 */
export function isValidCategory(category: string): boolean {
  return category in hierarchy
}

/**
 * Validate if a subcategory exists under a main category
 * @param mainCategory - The main category
 * @param subcategory - Subcategory to validate
 * @returns true if valid
 */
export function isValidSubcategory(mainCategory: string, subcategory: string): boolean {
  return !!hierarchy[mainCategory]?.[subcategory]
}

/**
 * Validate if an activity exists under a category and subcategory
 * @param mainCategory - The main category
 * @param subcategory - The subcategory
 * @param activity - Activity to validate
 * @returns true if valid
 */
export function isValidActivity(
  mainCategory: string,
  subcategory: string,
  activity: string
): boolean {
  return !!hierarchy[mainCategory]?.[subcategory]?.[activity]
}

/**
 * Validate if an intensity level exists for a specific activity
 * @param mainCategory - The main category
 * @param subcategory - The subcategory
 * @param activity - The activity name
 * @param intensity - Intensity to validate
 * @returns true if valid
 */
export function isValidIntensity(
  mainCategory: string,
  subcategory: string,
  activity: string,
  intensity: string
): boolean {
  return !!hierarchy[mainCategory]?.[subcategory]?.[activity]?.[intensity]
}