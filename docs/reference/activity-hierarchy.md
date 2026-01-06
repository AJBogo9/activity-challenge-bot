# Activity Hierarchy

The Activity Challenge Bot organizes over 1000 physical activities into a 4-level hierarchical structure, making it easy for users to find and log their activities accurately.

## Structure Overview

The hierarchy consists of four levels:

```
Main Category (19 categories)
└── Subcategory (~100 subcategories)
    └── Activity (~400 activities)
        └── Intensity (~1000+ variations)
            └── MET Data (MET value + examples)
```

## Data Source

All activity data comes from the **2024 Compendium of Physical Activities**, maintained by Arizona State University. This is the gold standard reference for exercise science research.

**Dataset Location**: `data/processed/activity-hierarchy.json`

This JSON file was generated from the original PDF compendium using a Python processing script (`scripts/pdf-to-json.py`).

## Level 1: Main Categories

The top level contains 19 broad categories:

1. **Bicycling** - All forms of cycling
2. **Conditioning Exercise** - Gym workouts, resistance training
3. **Dancing** - All dance styles
4. **Fishing and Hunting** - Outdoor recreational activities
5. **Home Activities** - Household chores, childcare
6. **Home Repair** - DIY, construction, maintenance
7. **Inactivity** - Sedentary activities (sitting, lying)
8. **Lawn and Garden** - Yard work, gardening
9. **Miscellaneous** - Activities not fitting other categories
10. **Music Playing** - Playing instruments
11. **Occupation** - Work-related activities
12. **Running** - All forms of running and jogging
13. **Self Care** - Personal hygiene, grooming
14. **Sexual Activity** - Physical intimacy
15. **Sports** - Competitive and recreational sports
16. **Transportation** - Walking, climbing stairs for transit
17. **Walking** - All forms of walking
18. **Water Activities** - Swimming, water sports
19. **Winter Activities** - Snow sports, cold weather activities

### Main Category Example: "Sports"

```
Sports/
├── Basketball/
├── Football/
├── Soccer/
├── Tennis/
├── Volleyball/
└── ... (many more)
```

## Level 2: Subcategories

Each main category is divided into more specific subcategories. The number varies by category.

### Examples by Category

**Bicycling** → "Mountain biking", "Road cycling", "Stationary cycling"

**Sports** → "Basketball", "Football", "Soccer", "Tennis", "Volleyball", "Swimming", etc.

**Home Activities** → "Cleaning", "Cooking", "Child care", "Moving furniture"

**Conditioning Exercise** → "Weight lifting", "Circuit training", "Stretching", "Calisthenics"

## Level 3: Activities

Within each subcategory are specific activities that users can select.

### Examples

**Sports → Basketball**:
- "Playing basketball, game"
- "Basketball, shooting baskets"
- "Basketball, drills"
- "Basketball, general"

**Running → General Running**:
- "Running, general"
- "Running, cross country"
- "Running, marathon"
- "Running, on a track"

**Water Activities → Swimming**:
- "Swimming laps"
- "Swimming, backstroke"
- "Swimming, breaststroke"
- "Swimming, butterfly"
- "Swimming, freestyle"
- "Swimming, leisure"

## Level 4: Intensity Levels

Each activity can have different intensity levels, which affect the MET value and therefore points earned.

### Common Intensity Classifications

**Light** - Minimal effort, conversational pace
- Examples: "light effort", "slow pace", "leisure"

**Moderate** - Some effort, can still talk
- Examples: "moderate effort", "general", "recreational"

**Vigorous** - Hard effort, difficult to maintain conversation
- Examples: "vigorous effort", "fast pace", "competitive"

**Very Vigorous** - Maximum effort, can't talk
- Examples: "very vigorous effort", "racing", "maximum effort"

### Activity Example with Intensities

**Running → General Running → "Running, general"**:

```json
{
  "general": {
    "met_value": 8.0,
    "examples": "Running, 5 mph (12 min/mile)"
  },
  "moderate": {
    "met_value": 9.8,
    "examples": "Running, 6 mph (10 min/mile)"
  },
  "vigorous": {
    "met_value": 11.0,
    "examples": "Running, 7 mph (8.5 min/mile)"
  },
  "very vigorous": {
    "met_value": 14.5,
    "examples": "Running, 9 mph (6.5 min/mile)"
  }
}
```

## MET Data Structure

Each intensity level contains MET data with two fields:

```typescript
{
  met_value: number,    // The MET value for point calculation
  examples: string      // Description/examples of this intensity
}
```

### Example from JSON

```json
{
  "Sports": {
    "Basketball": {
      "Playing basketball, game": {
        "general": [
          {
            "met_value": 6.5,
            "examples": "Basketball, game, general"
          }
        ],
        "competitive": [
          {
            "met_value": 8.0,
            "examples": "Basketball, game, competitive"
          }
        ]
      }
    }
  }
}
```

## Navigation in the Bot

Users navigate the hierarchy through inline keyboard buttons:

### Step-by-Step Flow

1. **Select Category**: User sees 19 category buttons
2. **Select Subcategory**: User sees subcategories for chosen category
3. **Select Activity**: User sees activities for chosen subcategory
4. **Select Intensity**: User sees intensity levels for chosen activity
5. **Enter Date**: User selects when they did the activity
6. **Enter Duration**: User enters how many minutes
7. **Confirm**: User reviews and submits

At each step, users can navigate back to change their selection.

### UI Example

```
📋 Select a category:
[🚴 Bicycling] [💪 Conditioning] [💃 Dancing]
[🏡 Home Activities] [🏃 Running] [⚽ Sports]
[🚶 Walking] [🏊 Water Activities] [⛷️ Winter]
... more buttons ...
```

## Helper Functions

The codebase provides utility functions for working with the hierarchy:

### Reading the Hierarchy

```typescript
// Get all main categories
getMainCategories(): string[]

// Get subcategories for a category
getSubcategories(mainCategory: string): string[]

// Get activities for a category + subcategory
getActivities(mainCategory: string, subcategory: string): string[]

// Get intensity levels for a specific activity
getIntensities(
  mainCategory: string, 
  subcategory: string, 
  activity: string
): string[]
```

### Getting MET Values

```typescript
// Get the MET value for a specific activity + intensity
getMetValue(
  mainCategory: string,
  subcategory: string,
  activity: string,
  intensity: string
): number

// Returns 0 if not found
```

### Validation

```typescript
// Check if each level exists
isValidCategory(category: string): boolean
isValidSubcategory(mainCategory: string, subcategory: string): boolean
isValidActivity(mainCategory: string, subcategory: string, activity: string): boolean
isValidIntensity(mainCategory: string, subcategory: string, activity: string, intensity: string): boolean
```

## Data Storage in Database

When an activity is logged, these values are stored:

```sql
activities (
  activity_type VARCHAR(255),  -- Full path: "Category > Subcategory > Activity > Intensity"
  duration INTEGER,            -- Minutes
  points DECIMAL(10,2),        -- Calculated from MET × duration / 60
  activity_date DATE           -- When activity was performed
)
```

### Example Activity Record

```
activity_type: "Sports > Basketball > Playing basketball, game > competitive"
duration: 45
points: 6.0
activity_date: 2026-01-15
```

## Processing the Raw Data

The hierarchy JSON is generated from the PDF compendium using a Python script:

**Script**: `scripts/pdf-to-json.py`

This script:
1. Parses the PDF compendium
2. Extracts activity names, categories, and MET values
3. Organizes into the 4-level hierarchy
4. Outputs `activity-hierarchy.json`

### Updating the Database

To update to a newer version of the compendium:

1. Download the latest PDF from https://pacompendium.com/
2. Place in `data/raw/compendium-YYYY.pdf`
3. Run `bun scripts/pdf-to-json.py`
4. Review the generated `activity-hierarchy.json`
5. No database migration needed (activities stored as strings)

## Design Decisions

### Why 4 Levels?

The 4-level hierarchy balances specificity with usability:
- **Too Few Levels**: 1000+ activities in a flat list would be overwhelming
- **Too Many Levels**: Navigation becomes tedious

4 levels provide enough organization without excessive clicking.

### Why Store Full Path as String?

Instead of separate columns for each hierarchy level, we store the full path as a single string:

**Advantages:**
- Flexible: Can change hierarchy without database migration
- Simple: One field to search/filter
- Human-readable in queries and exports

**Disadvantages:**
- Slightly more storage (but negligible)
- Can't easily query "all basketball activities" without string matching

The trade-off heavily favors flexibility for this use case.

### Why Not Full-Text Search?

The original design considered adding fuzzy text search (e.g., "run" → shows all running activities). This wasn't implemented because:

1. Hierarchical navigation is sufficient for most users
2. Activities have specific naming that may not match user intuition
3. Search requires understanding MET terminology
4. Inline keyboards are more mobile-friendly than text input

However, the architecture supports adding search in the future as an alternative entry point.

## Common Activities Quick Reference

For quick reference, here are commonly logged activities:

### Running
- **General running**: 8.0 METs
- **Jogging**: 7.0 METs
- **Sprint training**: 10.0+ METs

### Walking
- **Casual pace (2.0 mph)**: 2.5 METs
- **Moderate pace (3.0 mph)**: 3.5 METs
- **Brisk pace (4.0 mph)**: 5.0 METs

### Cycling
- **Leisure (<10 mph)**: 5.8 METs
- **Moderate (12-14 mph)**: 8.0 METs
- **Fast (16-19 mph)**: 10.0 METs

### Swimming
- **Leisure**: 6.0 METs
- **Laps, moderate**: 8.3 METs
- **Laps, vigorous**: 9.8 METs

### Gym
- **Weight training, general**: 3.5 METs
- **Weight training, vigorous**: 6.0 METs
- **Elliptical, moderate**: 5.0 METs
- **Rowing machine, vigorous**: 8.5 METs

## Future Enhancements

Possible improvements to the activity system:

1. **Search Function**: Fuzzy text search as alternative to hierarchy navigation
2. **Recently Used**: Show user's most frequently logged activities first
3. **Favorites**: Allow users to bookmark common activities
4. **Quick Log**: One-tap logging for favorited activities
5. **Custom Activities**: Allow guilds to define custom activities with MET values
6. **Photo Verification**: Optional photo upload for spot-checking activities

These would be additions, not replacements - the hierarchical navigation would remain as the primary interface.