import activitiesData from '../../../../../data/processed/4_level_hierarchy.json'
import type { MainCategories } from '../types'

export const hierarchy = activitiesData as MainCategories

export function getMainCategories(): string[] {
  return Object.keys(hierarchy)
}

export function getSubcategories(mainCategory: string): string[] {
  return Object.keys(hierarchy[mainCategory] || {})
}

export function getActivities(mainCategory: string, subcategory: string): string[] {
  return Object.keys(hierarchy[mainCategory]?.[subcategory] || {})
}

export function getIntensities(mainCategory: string, subcategory: string, activity: string): string[] {
  return Object.keys(hierarchy[mainCategory]?.[subcategory]?.[activity] || {})
}

export function getMetValue(
  mainCategory: string,
  subcategory: string,
  activity: string,
  intensity: string
): number {
  return hierarchy[mainCategory]?.[subcategory]?.[activity]?.[intensity]?.[0]?.met_value || 0
}

export function isValidCategory(category: string): boolean {
  return category in hierarchy
}

export function isValidSubcategory(mainCategory: string, subcategory: string): boolean {
  return !!hierarchy[mainCategory]?.[subcategory]
}

export function isValidActivity(mainCategory: string, subcategory: string, activity: string): boolean {
  return !!hierarchy[mainCategory]?.[subcategory]?.[activity]
}

export function isValidIntensity(
  mainCategory: string,
  subcategory: string,
  activity: string,
  intensity: string
): boolean {
  return !!hierarchy[mainCategory]?.[subcategory]?.[activity]?.[intensity]
}