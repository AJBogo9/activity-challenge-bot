# Bot Flows & Wizards

A detailed explanation of how conversation flows work in the Activity Challenge Bot, including the wizard pattern and scene management.

## What Are Scenes and Wizards?

**Scenes** are like different "screens" or "pages" in the bot interface. Each scene handles a specific functionality (profile, statistics, menu, etc.).

**Wizards** are special multi-step scenes that guide users through a process step-by-step, like filling out a form. Each step waits for user input before proceeding to the next step.

## Scene Architecture

The bot uses grammY's (Telegraf's) scene management system:

```typescript
import { Scenes } from 'telegraf'

// Simple scene
const myScene = new Scenes.BaseScene('scene_name')
myScene.enter(async (ctx) => {
  await ctx.reply('You entered the scene!')
})

// Wizard scene (multi-step)
const myWizard = new Scenes.WizardScene(
  'wizard_name',
  step1Handler,
  step2Handler,
  step3Handler
)
```

### Scene Lifecycle

```
User triggers action
    ↓
ctx.scene.enter('scene_name')
    ↓
Scene's .enter() hook executes
    ↓
Scene handlers process user input
    ↓
Scene updates bot messages
    ↓
ctx.scene.leave() (optional)
    ↓
Scene's .leave() hook executes
    ↓
Navigate to different scene or stay
```

## Activity Logging Wizard

The most complex wizard in the bot, with 7 steps to log a physical activity.

### Wizard State

```typescript
interface WizardState {
  mainCategory?: string      // e.g., "Sports"
  subcategory?: string       // e.g., "Basketball"
  activity?: string          // e.g., "Playing basketball, game"
  intensity?: string         // e.g., "competitive"
  metValue?: number          // e.g., 8.0
  activityDate?: Date        // e.g., 2026-01-15
  duration?: number          // e.g., 45 (minutes)
  calculatedPoints?: number  // e.g., 6.0
}
```

### Step-by-Step Flow

#### Step 0: Category Selection

**File:** `src/flows/activity/steps/1-category.ts`

```typescript
export async function showCategorySelection(ctx: any) {
  const categories = getMainCategories()
  const keyboard = createPaginatedKeyboard(categories)
  
  await TwoMessageManager.updateContent(
    ctx,
    '📋 Select activity category:',
    keyboard
  )
}

export async function handleCategorySelection(ctx: any) {
  const category = extractCallbackData(ctx, 'category:')
  
  if (!isValidCategory(category)) {
    await ctx.answerCbQuery('❌ Invalid category')
    return false
  }
  
  ctx.wizard.state.mainCategory = category
  await ctx.answerCbQuery()
  return true
}
```

**User sees:** Buttons like "🚴 Bicycling", "💪 Conditioning", "⚽ Sports"

**Stored:** User's category selection in `ctx.wizard.state.mainCategory`

#### Step 1: Subcategory Selection

**File:** `src/flows/activity/steps/2-subcategory.ts`

**User sees:** Subcategories for chosen category (e.g., "Basketball", "Football", "Soccer")

**Stored:** `ctx.wizard.state.subcategory`

#### Step 2: Activity Selection

**File:** `src/flows/activity/steps/3-activity.ts`

**User sees:** Specific activities (e.g., "Playing basketball, game", "Basketball, shooting baskets")

**Stored:** `ctx.wizard.state.activity`

#### Step 3: Intensity Selection

**File:** `src/flows/activity/steps/4-intensity.ts`

```typescript
export async function showIntensitySelection(ctx: any) {
  const { mainCategory, subcategory, activity } = ctx.wizard.state
  const intensities = getIntensities(mainCategory, subcategory, activity)
  
  const buttons = intensities.map(intensity => {
    const metValue = getMetValue(mainCategory, subcategory, activity, intensity)
    return [Markup.button.callback(
      `${intensity} (${metValue} METs)`,
      `intensity:${intensity}`
    )]
  })
  
  buttons.push([Markup.button.callback('❌ Cancel', 'intensity:cancel')])
  
  await TwoMessageManager.updateContent(
    ctx,
    '💪 Select intensity level:',
    Markup.inlineKeyboard(buttons)
  )
}
```

**User sees:** Intensity options with MET values (e.g., "general (6.5 METs)", "competitive (8.0 METs)")

**Stored:** `ctx.wizard.state.intensity` and `ctx.wizard.state.metValue`

#### Step 4: Date Selection

**File:** `src/flows/activity/steps/5-date.ts`

Uses a custom calendar picker:

```typescript
export async function showDateSelection(ctx: any) {
  const calendar = new Calendar(bot, {
    startWeekDay: 1,        // Monday
    monthFormat: 'MMMM YYYY',
    dateFormat: 'DD.MM.YYYY'
  })
  
  // Only allow dates within competition period
  calendar.setDateListener(async (ctx, date) => {
    if (!isWithinCompetition(date)) {
      await ctx.answerCbQuery('❌ Date outside competition period')
      return
    }
    
    ctx.wizard.state.activityDate = date
    await ctx.wizard.next()
  })
  
  await calendar.show(ctx)
}
```

**User sees:** Interactive calendar with selectable dates

**Stored:** `ctx.wizard.state.activityDate`

**Validation:** Date must be within current competition period

#### Step 5: Duration Input

**File:** `src/flows/activity/steps/6-duration.ts`

```typescript
export async function showDurationSelection(ctx: any) {
  await TwoMessageManager.updateContent(
    ctx,
    '⏱️ Enter duration in minutes:\n\nExample: `30` for 30 minutes',
    Markup.inlineKeyboard([
      [Markup.button.callback('❌ Cancel', 'duration:cancel')]
    ])
  )
}

export async function handleDurationInput(ctx: any) {
  const duration = parseInt(ctx.message?.text || '')
  
  if (isNaN(duration) || duration <= 0 || duration > 1440) {
    await ctx.reply('❌ Please enter a valid duration (1-1440 minutes)')
    return
  }
  
  ctx.wizard.state.duration = duration
  
  // Calculate points
  const { metValue } = ctx.wizard.state
  ctx.wizard.state.calculatedPoints = (metValue * duration) / 60
}
```

**User sees:** Prompt to enter duration

**User types:** A number (e.g., "45")

**Stored:** `ctx.wizard.state.duration`

**Calculated:** `ctx.wizard.state.calculatedPoints = (MET × duration) / 60`

**Validation:** Must be 1-1440 minutes (24 hours max)

#### Step 6: Confirmation

**File:** `src/flows/activity/steps/7-confirm.ts`

```typescript
export async function showConfirmation(ctx: any) {
  const state = ctx.wizard.state
  const dateStr = formatDate(state.activityDate)
  
  const summary = `
📝 *Activity Summary*

🏃 Activity: ${state.activity}
💪 Intensity: ${state.intensity}
📅 Date: ${dateStr}
⏱️ Duration: ${state.duration} minutes
⭐ Points: ${state.calculatedPoints.toFixed(2)}

Confirm to save this activity\\?
  `
  
  await TwoMessageManager.updateContent(
    ctx,
    summary,
    Markup.inlineKeyboard([
      [Markup.button.callback('✅ Confirm', 'confirm:yes')],
      [Markup.button.callback('❌ Cancel', 'confirm:cancel')]
    ])
  )
}
```

**User sees:** Complete summary of their activity with calculated points

**User clicks:** ✅ Confirm or ❌ Cancel

#### Step 7: Save to Database

**File:** `src/flows/activity/steps/7-confirm.ts`

```typescript
export async function handleConfirmation(ctx: any) {
  if (ctx.callbackQuery?.data !== 'confirm:yes') {
    return
  }
  
  const state = ctx.wizard.state
  const user = await getUserByTelegramId(ctx.from.id)
  
  if (!user) {
    await ctx.answerCbQuery('❌ User not found')
    return
  }
  
  try {
    // Save activity
    await createActivity({
      userId: user.id,
      activityType: `${state.mainCategory} > ${state.subcategory} > ${state.activity} > ${state.intensity}`,
      duration: state.duration,
      points: state.calculatedPoints,
      activityDate: state.activityDate,
      description: null
    })
    
    // Update user points
    await addPointsToUser(user.id, state.calculatedPoints)
    
    // Invalidate guild leaderboard cache
    invalidateGuildCache()
    
    await ctx.answerCbQuery('✅ Activity saved!')
    
    await TwoMessageManager.updateContent(
      ctx,
      `✅ *Activity logged successfully\\!*\n\nYou earned *${state.calculatedPoints.toFixed(2)} points*\\!`,
      Markup.inlineKeyboard([
        [Markup.button.callback('🏠 Main Menu', 'nav:menu')]
      ])
    )
    
    // Exit wizard
    await ctx.scene.leave()
    
  } catch (error) {
    console.error('Failed to save activity:', error)
    await ctx.answerCbQuery('❌ Failed to save activity')
  }
}
```

**Actions:**
1. Insert activity into database
2. Update user's total points
3. Invalidate guild cache (forces recalculation)
4. Show success message
5. Exit wizard

### Navigation Features

#### Back Buttons

Each step includes a back button in the implementation:

```typescript
// In step 2 (subcategory), user can go back to categories
if (ctx.callbackQuery?.data === 'subcategory:back') {
  ctx.wizard.selectStep(0)  // Go back to step 0
  await showCategorySelection(ctx)
  return
}
```

#### Cancel Buttons

```typescript
if (ctx.callbackQuery?.data === 'intensity:cancel') {
  await handleCancel(ctx)
  return
}

async function handleCancel(ctx: any) {
  await ctx.answerCbQuery('Cancelled')
  await ctx.scene.leave()
  await ctx.scene.enter('registered_menu')
}
```

#### Escape Middleware

Users can exit wizards at any time:

```typescript
activityWizard.use(TwoMessageManager.createEscapeMiddleware())
```

This middleware intercepts:
- `/start` command → Returns to main menu
- Reply keyboard buttons → Navigates to different scenes

## Registration Wizard

Simpler 3-step wizard for new user registration.

### Step 0: Terms & Conditions

**File:** `src/flows/register/steps/1-terms.ts`

```typescript
export async function showTermsStep(ctx: any) {
  const termsText = `
📜 *Terms and Conditions*

By using this bot, you agree to:
1\\. Provide accurate activity information
2\\. Accept that your activities are logged
3\\. Understand your data is stored securely

Your privacy is important\\. We only store:
\\- Telegram ID
\\- Name and username
\\- Guild affiliation
\\- Activity logs and points

Do you accept these terms\\?
  `
  
  await TwoMessageManager.updateContent(
    ctx,
    termsText,
    Markup.inlineKeyboard([
      [Markup.button.callback('✅ Accept', 'terms:accept')],
      [Markup.button.callback('❌ Decline', 'terms:decline')]
    ])
  )
}
```

**User sees:** Terms text with Accept/Decline buttons

### Step 1: Guild Selection

**File:** `src/flows/register/steps/2-guild.ts`

```typescript
export async function handleGuildSelection(ctx: any) {
  const guilds = getActiveGuilds()
  
  const buttons = guilds.map(guild => [
    Markup.button.callback(guild.name, `guild:${guild.name}`)
  ])
  
  await TwoMessageManager.updateContent(
    ctx,
    '🏛️ Select your guild:',
    Markup.inlineKeyboard(buttons)
  )
  
  // Wait for callback
  if (!ctx.callbackQuery?.data.startsWith('guild:')) {
    return false
  }
  
  const guildName = ctx.callbackQuery.data.replace('guild:', '')
  
  // Store pending user data
  ctx.wizard.state.pendingUser = {
    telegramId: ctx.from.id.toString(),
    username: ctx.from.username || '',
    firstName: ctx.from.first_name,
    lastName: ctx.from.last_name || '',
    guild: guildName
  }
  
  return true
}
```

**User sees:** List of all active guilds

**Stored:** Complete user data in `ctx.wizard.state.pendingUser`

### Step 2: Confirmation

**File:** `src/flows/register/steps/3-confirm.ts`

```typescript
export async function handleConfirmation(ctx: any) {
  const { pendingUser } = ctx.wizard.state
  
  const summary = `
✅ *Registration Summary*

👤 Name: ${pendingUser.firstName} ${pendingUser.lastName}
🏛️ Guild: ${pendingUser.guild}

Confirm registration\\?
  `
  
  await TwoMessageManager.updateContent(
    ctx,
    summary,
    Markup.inlineKeyboard([
      [Markup.button.callback('✅ Confirm', 'register:confirm')],
      [Markup.button.callback('❌ Cancel', 'register:cancel')]
    ])
  )
  
  // Wait for confirmation
  if (ctx.callbackQuery?.data === 'register:confirm') {
    await createUser(pendingUser)
    
    await ctx.answerCbQuery('✅ Registration complete!')
    
    // Update keyboard to show registered buttons
    await TwoMessageManager.updateKeyboard(ctx, [
      ['👤 Profile', '💪 Log Activity'],
      ['📊 Statistics', 'ℹ️ Info'],
      ['💬 Feedback']
    ])
    
    await ctx.scene.leave()
    await ctx.scene.enter('registered_menu')
  }
}
```

**Actions:**
1. Show confirmation with user data
2. Create user in database
3. Update reply keyboard (add registered features)
4. Navigate to registered menu

## Simple Scenes (Non-Wizard)

Some features use simple scenes without multi-step flow:

### Profile Scene

**File:** `src/flows/profile/profile-menu.ts`

```typescript
const profileScene = new Scenes.BaseScene('profile')

profileScene.enter(async (ctx) => {
  const user = await getUserByTelegramId(ctx.from.id)
  const summary = await getUserSummary(ctx.from.id)
  
  const profileText = `
👤 *Your Profile*

Name: ${user.first_name}
Guild: ${user.guild}
Points: ${user.points}

🏆 Rankings:
Global: #${summary.global_rank} of ${summary.total_users}
Guild: #${summary.guild_rank} of ${summary.guild_users}
  `
  
  await TwoMessageManager.updateContent(
    ctx,
    profileText,
    Markup.inlineKeyboard([
      [Markup.button.callback('📜 Activity History', 'profile:history')],
      [Markup.button.callback('🗑️ Delete Account', 'profile:delete')],
      [Markup.button.callback('🏠 Main Menu', 'nav:menu')]
    ])
  )
})

// Handle button clicks
profileScene.action('profile:history', async (ctx) => {
  await ctx.scene.enter('activity_history')
})
```

Single-step scene that displays information and provides navigation.

### Statistics Scene

**File:** `src/flows/stats/stats-menu.ts`

Shows leaderboards and rankings without user input.

## Scene Composition

The bot registers all scenes in a stage:

```typescript
import { Scenes, session } from 'telegraf'

const stage = new Scenes.Stage([
  menuRouter,
  registeredMenu,
  unregisteredMenu,
  activityWizard,
  registerWizard,
  profileScene,
  statsScene,
  infoScene,
  feedbackWizard
])

bot.use(session())
bot.use(stage.middleware())
```

## State Management Best Practices

### Wizard State

Wizard state is temporary and cleared when wizard exits:

```typescript
activityWizard.leave(async (ctx) => {
  ctx.wizard.state = {}  // Clear all state
})
```

### Session State

Session state persists across scenes:

```typescript
interface Session {
  contentMessageId?: number
  keyboardMessageId?: number
  lastSceneId?: string
  lastContent?: string
}
```

### When to Use Which

- **Wizard State**: Multi-step form data (temporary)
- **Session State**: UI persistence (message IDs, last displayed content)
- **Database**: Permanent data (user profile, activities, points)

## Error Handling in Flows

### Input Validation

```typescript
// In duration step
const duration = parseInt(ctx.message?.text || '')

if (isNaN(duration) || duration <= 0) {
  await ctx.reply('❌ Invalid duration. Please enter a number.')
  return  // Don't advance to next step
}

ctx.wizard.state.duration = duration
await ctx.wizard.next()  // Valid input, proceed
```

### Database Errors

```typescript
try {
  await createActivity(activityData)
  await ctx.answerCbQuery('✅ Saved!')
} catch (error) {
  console.error('Database error:', error)
  await ctx.answerCbQuery('❌ Failed to save. Please try again.')
  // Stay in current step, don't advance
}
```

### API Errors

```typescript
try {
  await ctx.telegram.editMessageText(...)
} catch (error) {
  // Message might be too old to edit
  // Create new message instead
  const newMsg = await ctx.reply(text)
  ctx.session.contentMessageId = newMsg.message_id
}
```

## Testing Flows

Flows can be tested by simulating user actions:

```typescript
// Example test for activity wizard
test('activity wizard completes successfully', async () => {
  const ctx = createMockContext()
  
  // Enter wizard
  await ctx.scene.enter('activity_wizard')
  
  // Step 0: Select category
  await simulateCallback(ctx, 'category:Sports')
  
  // Step 1: Select subcategory
  await simulateCallback(ctx, 'subcategory:Basketball')
  
  // ... continue through all steps
  
  // Verify activity was saved
  const activities = await getActivitiesByUserId(ctx.from.id)
  expect(activities).toHaveLength(1)
})
```

## Flow Diagram: Activity Wizard

```
START
  │
  ↓
[Show Categories] ← User can Cancel here
  │
  ↓
[User selects category]
  │
  ↓
[Show Subcategories] ← User can go Back or Cancel
  │
  ↓
[User selects subcategory]
  │
  ↓
[Show Activities] ← User can go Back or Cancel
  │
  ↓
[User selects activity]
  │
  ↓
[Show Intensities] ← User can go Back or Cancel
  │
  ↓
[User selects intensity]
  │
  ↓
[Show Calendar] ← User can Cancel
  │
  ↓
[User selects date]
  │
  ↓
[Ask Duration] ← User can Cancel
  │
  ↓
[User enters number]
  │
  ↓
[Calculate Points]
  │
  ↓
[Show Confirmation] ← User can Cancel
  │
  ↓
[User confirms]
  │
  ↓
[Save to Database]
  │
  ↓
[Update User Points]
  │
  ↓
[Show Success]
  │
  ↓
END (return to menu)
```

## Best Practices

1. **Always validate user input** before storing in state
2. **Provide Cancel buttons** on every step
3. **Show progress indicators** when appropriate (Step 3/7)
4. **Use the escape middleware** to allow users to exit anytime
5. **Clear wizard state** on leave to prevent stale data
6. **Handle errors gracefully** without crashing the wizard
7. **Use descriptive callback data** (e.g., `category:Sports` not just `Sports`)
8. **Answer callback queries** to prevent "loading" indicators
9. **Keep steps focused** - one question/action per step
10. **Provide helpful error messages** that guide users to correct input