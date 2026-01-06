# Code Patterns and Conventions

This guide documents the coding patterns, conventions, and best practices used throughout the Activity Challenge Bot codebase.

## Core Patterns

### Two-Message Manager Pattern

The most important UX pattern in the bot. See [Two-Message Manager](/architecture/two-message-manager) for full documentation.

**Summary**: Every wizard step creates exactly two messages:
1. Question message (deleted after step completes)
2. Answer message (persists as conversation history)

**Usage**:

```typescript
import { TwoMessageManager } from '../../utils'

const tmm = new TwoMessageManager(ctx)

// Show question with inline keyboard
await tmm.showQuestion('Select your guild:', keyboard)

// User clicks button, handle response
await tmm.showAnswer('✅ Guild: Athene')

// Move to next step - question is auto-deleted
```

### Wizard Pattern

Multi-step conversation flows using Telegraf's Wizard Scene.

**Structure**:

```typescript
import { Scenes } from 'telegraf'

export const myWizard = new Scenes.WizardScene<any>(
  'wizard_name',
  
  // Step 0: Show first question
  async (ctx) => {
    await showQuestion(ctx)
    return ctx.wizard.next()
  },
  
  // Step 1: Handle response, show next question
  async (ctx) => {
    await handleResponse(ctx)
    await showNextQuestion(ctx)
    return ctx.wizard.next()
  },
  
  // Step N: Final step
  async (ctx) => {
    await handleFinalResponse(ctx)
    // Exit automatically after last step
  }
)

// Add escape middleware for /start
myWizard.use(TwoMessageManager.createEscapeMiddleware())

// Clean up on exit
myWizard.leave(async (ctx) => {
  ctx.wizard.state = {}
})
```

**Key Principles**:
- Each step is an async function
- Step functions show questions OR handle responses
- Use `ctx.wizard.next()` to advance
- Store state in `ctx.wizard.state`
- Always add escape middleware
- Always clean up on leave

### Step Organization Pattern

Wizard steps are separated into individual files for clarity.

**File Naming**: `N-description.ts` where N is the step number

```
steps/
├── 1-category.ts      # Step 0 handlers
├── 2-subcategory.ts   # Step 1 handlers
├── 3-activity.ts      # Step 2 handlers
└── 4-confirm.ts       # Step 3 handlers
```

**Each Step File Exports**:
- `showXxxSelection()` - Displays the question
- `handleXxxSelection()` - Processes the response

Example:

```typescript
// steps/1-category.ts

export async function showCategorySelection(ctx: any) {
  const tmm = new TwoMessageManager(ctx)
  const categories = getMainCategories()
  const keyboard = buildKeyboard(categories)
  await tmm.showQuestion('Select a category:', keyboard)
}

export async function handleCategorySelection(ctx: any) {
  const tmm = new TwoMessageManager(ctx)
  const data = ctx.callbackQuery.data
  const category = data.replace('category:', '')
  
  // Save to state
  ctx.wizard.state.mainCategory = category
  
  // Show answer
  await tmm.showAnswer(`📁 Category: ${category}`)
  
  return true
}
```

## Database Patterns

### Query Functions

All database operations are functions that return promises.

**Naming Convention**:
- `get` prefix for retrieval: `getUserByTelegramId()`
- `create` prefix for insertion: `createUser()`
- `update` prefix for modification: `updateUserPoints()`
- `delete` prefix for deletion: `deleteUser()`

**Example**:

```typescript
// src/db/users.ts

export async function getUserByTelegramId(telegramId: string) {
  const [user] = await sql`
    SELECT * FROM users 
    WHERE telegram_id = ${telegramId}
  `
  return user || null
}

export async function createUser(data: CreateUserData) {
  const [user] = await sql`
    INSERT INTO users (telegram_id, username, first_name, last_name, guild)
    VALUES (${data.telegramId}, ${data.username}, ${data.firstName}, 
            ${data.lastName}, ${data.guild})
    RETURNING *
  `
  return user
}
```

### Type Safety

Use TypeScript interfaces for all data structures.

```typescript
interface CreateUserData {
  telegramId: string
  username: string
  firstName: string
  lastName: string
  guild: string
}

interface User {
  id: number
  telegram_id: string
  username: string
  first_name: string
  last_name: string
  guild: string
  points: number
  created_at: Date
}
```

### Transaction Pattern

For operations that must succeed or fail together:

```typescript
export async function logActivityWithPoints(
  userId: number, 
  activityData: ActivityData
) {
  return await sql.begin(async (sql) => {
    // Insert activity
    const [activity] = await sql`
      INSERT INTO activities (user_id, activity_type, duration, points)
      VALUES (${userId}, ${activityData.type}, ${activityData.duration}, ${activityData.points})
      RETURNING *
    `
    
    // Update user points
    await sql`
      UPDATE users 
      SET points = points + ${activityData.points}
      WHERE id = ${userId}
    `
    
    return activity
  })
}
```

## Error Handling Patterns

### Try-Catch in Async Functions

Always wrap async operations in try-catch blocks.

```typescript
export async function handleUserAction(ctx: any) {
  try {
    const user = await getUserByTelegramId(ctx.from.id.toString())
    if (!user) {
      await ctx.reply('Please register first with /start')
      return
    }
    // Process action...
  } catch (error) {
    console.error('Error in handleUserAction:', error)
    await ctx.reply('An error occurred. Please try again.')
  }
}
```

### Graceful Degradation

Provide fallbacks when possible.

```typescript
// If user data fails to load, show empty state instead of crashing
export async function showProfile(ctx: any) {
  try {
    const user = await getUserByTelegramId(ctx.from.id.toString())
    // Show profile...
  } catch (error) {
    console.error('Failed to load profile:', error)
    await ctx.reply('Unable to load your profile right now. Please try again later.')
  }
}
```

### Callback Query Acknowledgment

Always acknowledge callback queries to prevent "loading" state in Telegram.

```typescript
export async function handleButtonClick(ctx: any) {
  try {
    // Process the click
    await processAction(ctx)
    
    // Acknowledge (removes loading spinner)
    await ctx.answerCbQuery()
  } catch (error) {
    // Still acknowledge on error
    await ctx.answerCbQuery('An error occurred')
  }
}
```

## Keyboard Patterns

### Inline Keyboard Builder

Use Telegraf's Markup for inline keyboards.

```typescript
import { Markup } from 'telegraf'

// Single row
const keyboard = Markup.inlineKeyboard([
  Markup.button.callback('Option 1', 'action:1'),
  Markup.button.callback('Option 2', 'action:2')
])

// Multiple rows
const keyboard = Markup.inlineKeyboard([
  [Markup.button.callback('Row 1 Button 1', 'action:1')],
  [Markup.button.callback('Row 2 Button 1', 'action:2')],
  [Markup.button.callback('Cancel', 'cancel')]
])

// Use in message
await ctx.reply('Select an option:', keyboard)
```

### Keyboard Pagination

For long lists, paginate the keyboard.

```typescript
function buildPaginatedKeyboard(items: string[], page: number, pageSize: number = 10) {
  const start = page * pageSize
  const end = start + pageSize
  const pageItems = items.slice(start, end)
  
  const buttons = pageItems.map(item => [
    Markup.button.callback(item, `select:${item}`)
  ])
  
  // Add navigation buttons
  const nav = []
  if (page > 0) {
    nav.push(Markup.button.callback('◀️ Previous', `page:${page - 1}`))
  }
  if (end < items.length) {
    nav.push(Markup.button.callback('Next ▶️', `page:${page + 1}`))
  }
  
  if (nav.length > 0) {
    buttons.push(nav)
  }
  
  return Markup.inlineKeyboard(buttons)
}
```

### Cancel Button Pattern

Always provide a way to exit/cancel.

```typescript
const keyboard = Markup.inlineKeyboard([
  [Markup.button.callback('Option 1', 'action:1')],
  [Markup.button.callback('Option 2', 'action:2')],
  [Markup.button.callback('❌ Cancel', 'action:cancel')]  // Always at bottom
])
```

## Code Style Conventions

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Files | kebab-case | `activity-data.ts` |
| Functions | camelCase | `getUserByTelegramId()` |
| Classes | PascalCase | `TwoMessageManager` |
| Constants | UPPER_SNAKE_CASE | `CURRENT_COMPETITION` |
| Interfaces | PascalCase | `WizardState` |
| Types | PascalCase | `ActivityData` |

### Function Organization

Order functions by usage flow:

```typescript
// 1. Public API functions first
export async function showCategorySelection(ctx: any) { }
export async function handleCategorySelection(ctx: any) { }

// 2. Helper functions after
function buildCategoryKeyboard() { }
function validateCategory(category: string) { }

// 3. Internal utilities last
function formatCategoryName(name: string) { }
```

### Import Organization

Group imports by source:

```typescript
// 1. Node.js built-ins
import { readFileSync } from 'fs'

// 2. Third-party packages
import { Markup } from 'telegraf'

// 3. Local modules
import { TwoMessageManager } from '../../utils'
import { getMainCategories } from './helpers/activity-data'
```

### Async/Await

Always use async/await, never `.then()/.catch()`.

```typescript
// ✅ Good
async function doSomething() {
  try {
    const result = await asyncOperation()
    return result
  } catch (error) {
    console.error(error)
  }
}

// ❌ Bad
function doSomething() {
  return asyncOperation()
    .then(result => result)
    .catch(error => console.error(error))
}
```

### Comments

Use comments to explain **why**, not **what**.

```typescript
// ✅ Good
// MET-hours = (MET × duration) / 60
// We divide by 60 to keep points manageable for users
const points = (metValue * duration) / 60

// ❌ Bad  
// Calculate points
const points = (metValue * duration) / 60
```

## Telegram-Specific Patterns

### Context Type

The bot uses `any` for ctx type due to Telegraf's complex typing.

```typescript
// We use 'any' for ctx throughout the codebase
async function handleMessage(ctx: any) {
  // Access Telegram data
  const userId = ctx.from.id
  const messageText = ctx.message.text
}
```

### Message Editing

Edit messages instead of sending new ones when possible.

```typescript
// Edit existing message
await ctx.editMessageText('Updated text', {
  reply_markup: newKeyboard.reply_markup
})

// Only send new message if edit fails
try {
  await ctx.editMessageText('Updated text')
} catch {
  await ctx.reply('Updated text')
}
```

### Callback Data Patterns

Use prefixes to identify callback actions.

```typescript
// Create buttons with prefixed data
Markup.button.callback('Category', 'category:sports')
Markup.button.callback('Subcategory', 'subcategory:running')
Markup.button.callback('Cancel', 'action:cancel')

// Handle with prefix matching
if (ctx.callbackQuery.data.startsWith('category:')) {
  const category = ctx.callbackQuery.data.replace('category:', '')
  // Handle category selection
}
```

## Performance Patterns

### Avoid N+1 Queries

Fetch related data in single query.

```typescript
// ✅ Good - Single query with JOIN
const activitiesWithUsers = await sql`
  SELECT a.*, u.username, u.guild
  FROM activities a
  JOIN users u ON a.user_id = u.id
  WHERE a.activity_date >= ${startDate}
`

// ❌ Bad - N+1 queries
const activities = await sql`SELECT * FROM activities`
for (const activity of activities) {
  const user = await sql`SELECT * FROM users WHERE id = ${activity.user_id}`
}
```

### Cache Expensive Operations

Cache data that doesn't change frequently.

```typescript
// Cache activity hierarchy (loaded once on startup)
import activitiesData from '../../../../data/processed/activity-hierarchy.json'
export const hierarchy = activitiesData as HierarchyData

// Don't load from disk on every request
```

### Limit Array Operations

Use database queries instead of loading everything into memory.

```typescript
// ✅ Good - Let database do the work
const topUsers = await sql`
  SELECT * FROM users 
  ORDER BY points DESC 
  LIMIT 10
`

// ❌ Bad - Load all data into memory
const allUsers = await sql`SELECT * FROM users`
const topUsers = allUsers.sort((a, b) => b.points - a.points).slice(0, 10)
```

## Testing Patterns

See [Testing Guide](/development/testing) for comprehensive testing patterns.

## Common Pitfalls

### Forgetting to Acknowledge Callbacks

```typescript
// ❌ Bad - User sees loading spinner forever
await ctx.reply('Done!')

// ✅ Good
await ctx.reply('Done!')
await ctx.answerCbQuery()
```

### Not Cleaning Up Wizard State

```typescript
// ❌ Bad - State persists across sessions
myWizard.leave(async (ctx) => {
  // Nothing here
})

// ✅ Good
myWizard.leave(async (ctx) => {
  ctx.wizard.state = {}
})
```

### Circular Imports

```typescript
// ❌ Bad
// File A imports File B
// File B imports File A

// ✅ Good - Extract shared code to third file
// File A imports File C
// File B imports File C
```

## Next Steps

- Learn about [Testing](/development/testing)
- Review [Architecture Overview](/architecture/overview)
- Read [Database Documentation](/architecture/database)
- Explore [Project Structure](/development/project-structure)