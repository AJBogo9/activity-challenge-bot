import { Context } from 'telegraf'
import Fuse from 'fuse.js'
import activitiesData from '../../../data/processed/activity-hierarchy.json'

interface ActivityData {
  met_value: number
  examples: string
}

interface IntensityLevel {
  [intensity: string]: ActivityData[]
}

interface Activities {
  [activity: string]: IntensityLevel
}

interface Subcategories {
  [subcategory: string]: Activities | IntensityLevel
}

interface MainCategories {
  [mainCategory: string]: Subcategories
}

interface SearchableActivity {
  id: string
  name: string
  mainCategory: string
  subcategory: string
  activity: string
  skipActivityStep: boolean
  fullPath: string
}

const hierarchy = activitiesData as MainCategories

// Build a flat searchable list of all activities
function buildSearchableActivities(): SearchableActivity[] {
  const activities: SearchableActivity[] = []
  let idCounter = 0

  for (const [mainCategory, subcategories] of Object.entries(hierarchy)) {
    for (const [subcategory, activitiesOrIntensities] of Object.entries(subcategories)) {
      const firstKey = Object.keys(activitiesOrIntensities)[0]
      const firstItem = activitiesOrIntensities[firstKey]
      
      // Check if this is directly an intensity level
      const isIntensityLevel = Array.isArray(firstItem)
      
      if (isIntensityLevel) {
        // This subcategory is directly an activity
        activities.push({
          id: `act_${idCounter++}`,
          name: subcategory,
          mainCategory,
          subcategory,
          activity: subcategory,
          skipActivityStep: true,
          fullPath: `${mainCategory} > ${subcategory}`
        })
      } else {
        // This has nested activities
        for (const activity of Object.keys(activitiesOrIntensities)) {
          activities.push({
            id: `act_${idCounter++}`,
            name: activity,
            mainCategory,
            subcategory,
            activity,
            skipActivityStep: false,
            fullPath: `${mainCategory} > ${subcategory} > ${activity}`
          })
        }
      }
    }
  }

  return activities
}

const searchableActivities = buildSearchableActivities()

// Configure Fuse.js for fuzzy searching
const fuse = new Fuse(searchableActivities, {
  keys: ['name', 'mainCategory', 'subcategory', 'fullPath'],
  threshold: 0.4, // 0 = perfect match, 1 = match anything
  ignoreLocation: true,
  minMatchCharLength: 2
})

export async function handleInlineQuery(ctx: Context) {
  const query = ctx.inlineQuery?.query || ''
  
  // If query is empty, show some popular activities
  const results = query.length === 0 
    ? searchableActivities.slice(0, 20)
    : fuse.search(query, { limit: 20 }).map(result => result.item)

  // Convert to Telegram inline query results
  const inlineResults = results.map((activity) => ({
    type: 'article' as const,
    id: activity.id,
    title: activity.name,
    description: activity.fullPath,
    input_message_content: {
      message_text: `/quicklog ${activity.id}`
    }
  }))

  await ctx.answerInlineQuery(inlineResults, {
    cache_time: 300, // Cache results for 5 minutes
    is_personal: true
  })
}

// Helper function to get activity data by ID
export function getActivityById(id: string): SearchableActivity | undefined {
  return searchableActivities.find(activity => activity.id === id)
}