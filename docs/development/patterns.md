# Code Patterns and Conventions

Bot-specific patterns and architectural decisions. For general TypeScript best practices, see [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html).

## Core Bot Patterns

### Two-Message Manager Pattern

**The most important UX pattern** - maintains exactly two persistent messages per user.

See [Two-Message Manager](/architecture/two-message-manager) for full documentation.

**Quick Usage:**
```typescript
import { TwoMessageManager } from '../../utils'

// Show question with keyboard
await TwoMessageManager.updateContent(ctx, 'Select your guild:', keyboard)

// User responds - delete their message
await TwoMessageManager.deleteUserMessage(ctx)

// Show confirmation
await TwoMessageManager.updateContent(ctx, '✅ Guild: Athene', nextKeyboard)
```

### Wizard Step Organization

Steps are separated into individual files: `N-description.ts`

```
steps/
├── 1-category.ts      # Step 0 handlers
├── 2-subcategory.ts   # Step 1 handlers
├── 3-activity.ts      # Step 2 handlers
└── 4-confirm.ts       # Step 3 handlers
```

**Each step file exports:**
```typescript
// Display the question
export async function showXxxSelection(ctx: any) { }

// Process the response
export async function handleXxxSelection(ctx: any) { }
```

### Wizard Composition

```typescript
import { Scenes } from 'telegraf'

export const myWizard = new Scenes.WizardScene<any>(
  'wizard_name',
  
  // Step 0: Show question
  async (ctx) => {
    await showQuestion(ctx)
    return ctx.wizard.next()
  },
  
  // Step 1: Handle response, show next
  async (ctx) => {
    await handleResponse(ctx)
    await showNextQuestion(ctx)
    return ctx.wizard.next()
  },
  
  // Step N: Final step (auto-exits)
  async (ctx) => {
    await handleFinalResponse(ctx)
  }
)

// Essential: Add escape middleware
myWizard.use(TwoMessageManager.createEscapeMiddleware())

// Essential: Clean up state
myWizard.leave(async (ctx) => {
  ctx.wizard.state = {}
})
```

## Database Patterns

### Query Function Naming

- `get` prefix: Retrieval → `getUserByTelegramId()`
- `create` prefix: Insertion → `createUser()`
- `update` prefix: Modification → `updateUserPoints()`
- `delete` prefix: Deletion → `deleteUser()`

### Type Safety

```typescript
interface CreateUserData {
  telegramId: string
  username: string
  firstName: string
  lastName: string
  guild: string
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

### Transactions for Related Operations

```typescript
export async function logActivityWithPoints(userId: number, activityData: ActivityData) {
  return await sql.begin(async (sql) => {
    // Insert activity
    const [activity] = await sql`INSERT INTO activities ...`
    
    // Update user points
    await sql`UPDATE users SET points = points + ${activityData.points} WHERE id = ${userId}`
    
    return activity
  })
}
```

## Telegram-Specific Patterns

### Callback Data Prefixes

Use prefixes to identify action types:

```typescript
// Create buttons
Markup.button.callback('Category', 'category:sports')
Markup.button.callback('Subcategory', 'subcategory:running')
Markup.button.callback('Cancel', 'action:cancel')

// Handle with prefix matching
if (ctx.callbackQuery.data.startsWith('category:')) {
  const category = ctx.callbackQuery.data.replace('category:', '')
  // Handle category selection
}
```

### Always Acknowledge Callbacks

```typescript
export async function handleButtonClick(ctx: any) {
  try {
    await processAction(ctx)
    await ctx.answerCbQuery()  // Remove loading spinner
  } catch (error) {
    await ctx.answerCbQuery('An error occurred')  // Still acknowledge
  }
}
```

### Keyboard Pagination

```typescript
function buildPaginatedKeyboard(items: string[], page: number, pageSize = 10) {
  const start = page * pageSize
  const pageItems = items.slice(start, start + pageSize)
  
  const buttons = pageItems.map(item => [
    Markup.button.callback(item, `select:${item}`)
  ])
  
  const nav = []
  if (page > 0) nav.push(Markup.button.callback('◀️ Prev', `page:${page - 1}`))
  if (start + pageSize < items.length) nav.push(Markup.button.callback('Next ▶️', `page:${page + 1}`))
  
  if (nav.length > 0) buttons.push(nav)
  
  return Markup.inlineKeyboard(buttons)
}
```

### Always Provide Cancel

```typescript
const keyboard = Markup.inlineKeyboard([
  [Markup.button.callback('Option 1', 'action:1')],
  [Markup.button.callback('Option 2', 'action:2')],
  [Markup.button.callback('❌ Cancel', 'action:cancel')]  // Always at bottom
])
```

## Performance Patterns

### Avoid N+1 Queries

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

### Cache Static Data

```typescript
// Load once on startup, not per request
import activitiesData from '../../../../data/processed/activity-hierarchy.json'
export const hierarchy = activitiesData as HierarchyData
```

### Use Database for Heavy Lifting

```typescript
// ✅ Good - Database does the work
const topUsers = await sql`
  SELECT * FROM users 
  ORDER BY points DESC 
  LIMIT 10
`

// ❌ Bad - Load everything into memory
const allUsers = await sql`SELECT * FROM users`
const topUsers = allUsers.sort((a, b) => b.points - a.points).slice(0, 10)
```

## Project-Specific Conventions

### File Naming
- Files: `kebab-case.ts`
- Functions: `camelCase()`
- Classes: `PascalCase`
- Constants: `UPPER_SNAKE_CASE`

### Import Organization
```typescript
// 1. Node built-ins
import { readFileSync } from 'fs'

// 2. Third-party
import { Markup } from 'telegraf'

// 3. Local modules
import { TwoMessageManager } from '../../utils'
import { getMainCategories } from './helpers/activity-data'
```

### Error Handling

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

## Common Pitfalls

### ❌ Forgetting Callback Acknowledgment
```typescript
// Bad - loading spinner forever
await ctx.reply('Done!')

// Good
await ctx.reply('Done!')
await ctx.answerCbQuery()
```

### ❌ Not Cleaning Wizard State
```typescript
// Bad - state persists
myWizard.leave(async (ctx) => {})

// Good
myWizard.leave(async (ctx) => {
  ctx.wizard.state = {}
})
```

### ❌ Circular Imports
Extract shared code to a third file instead of importing between dependent files.

## Next Steps

- Review [Testing Guide](/development/testing)
- Understand [Project Structure](/development/project-structure)
- Read [Architecture Overview](/architecture/overview)