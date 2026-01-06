# Two-Message Manager Pattern

The Two-Message Manager is a core architectural pattern that keeps the bot's chat interface clean and organized by maintaining exactly two persistent messages per user.

## The Problem

Traditional Telegram bots often create cluttered conversations:
- Each interaction creates new messages
- Users must scroll to find information
- Old messages remain visible
- Keyboards push content up and out of view

**Example of cluttered chat:**
```
Bot: What's your name?
User: John
Bot: What's your guild?
User: TiK
Bot: Confirm registration?
User: Yes
Bot: Registration complete!
```

After 10 interactions, the user sees 20+ messages and must scroll.

## The Solution

The Two-Message Manager maintains **exactly two messages**:

1. **Content Message**: Displays current information (continuously updated)
2. **Keyboard Message**: Shows reply keyboard at bottom (rarely changes)

**Same interaction with Two-Message Manager:**
```
[Content Message - updated in place]
Registration complete! ✅

[Keyboard Message - stays at bottom]
[👤 Profile] [💪 Log Activity]
[📊 Statistics] [ℹ️ Info]
```

After 10 interactions, the user still sees only 2 messages.

## Architecture

### Message Types

```typescript
interface Session {
  contentMessageId?: number    // ID of the content message
  keyboardMessageId?: number   // ID of the keyboard message
  lastSceneId?: string        // Last scene displayed
  lastContent?: string        // Last content shown (for deduplication)
}
```

### Content Message

- **Purpose**: Display dynamic information
- **Update Method**: `editMessageText()` (in-place editing)
- **Content**: Scene-specific text (profile, stats, activity wizard, etc.)
- **Inline Keyboard**: Scene-specific buttons (navigation, actions)

### Keyboard Message

- **Purpose**: Persistent navigation at bottom of chat
- **Update Method**: Rarely changed (only when user state changes)
- **Content**: Simple header text ("📱 Main Navigation")
- **Reply Keyboard**: Main navigation buttons (always visible)

## Implementation

### Initialization

When user starts the bot or returns to main menu:

```typescript
await TwoMessageManager.init(ctx)
```

This creates both messages:

```typescript
static async init(ctx: any, buttons?: string[][], keyboardText = '📱 *Main Navigation*') {
  // Delete old messages if they exist
  await this.cleanup(ctx)

  // Create content message (will be edited later)
  const contentMsg = await ctx.reply('⏳ Loading...')
  ctx.session.contentMessageId = contentMsg.message_id

  // Create reply keyboard message (stays at bottom)
  const defaultButtons = [
    ['👤 Profile', '💪 Log Activity'],
    ['📊 Statistics', 'ℹ️ Info'],
    ['💬 Feedback']
  ]

  const keyboardMsg = await ctx.reply(keyboardText, {
    parse_mode: 'MarkdownV2',
    ...Markup.keyboard(buttons || defaultButtons)
      .resize()
      .persistent()
  })
  ctx.session.keyboardMessageId = keyboardMsg.message_id
}
```

### Updating Content

Throughout the bot's operation, scenes update the content message:

```typescript
await TwoMessageManager.updateContent(
  ctx,
  '📊 *Your Statistics*\n\nPoints: 42\nRank: #5',
  Markup.inlineKeyboard([
    [Markup.button.callback('📜 History', 'stats:history')],
    [Markup.button.callback('🏠 Menu', 'nav:menu')]
  ])
)
```

Implementation with deduplication:

```typescript
static async updateContent(ctx: any, text: string, inlineKeyboard?: any) {
  try {
    if (!ctx.session?.contentMessageId) {
      throw new Error('No content message exists')
    }

    // Store current scene and content for comparison
    const currentSceneId = ctx.scene.current?.id
    const lastSceneId = ctx.session.lastSceneId
    const lastContent = ctx.session.lastContent

    // If we're in the same scene with the same content, skip update
    if (currentSceneId === lastSceneId && text === lastContent) {
      return
    }

    await ctx.telegram.editMessageText(
      ctx.chat.id,
      ctx.session.contentMessageId,
      undefined,
      text,
      {
        parse_mode: 'MarkdownV2',
        ...inlineKeyboard
      }
    )

    // Track the scene and content we just displayed
    ctx.session.lastSceneId = currentSceneId
    ctx.session.lastContent = text
  } catch (error) {
    // If edit fails (message too old or deleted), create new content message
    const options = {
      parse_mode: 'MarkdownV2' as const,
      ...(inlineKeyboard || {})
    }
    
    const contentMsg = await ctx.reply(text, options)
    ctx.session.contentMessageId = contentMsg.message_id
    
    // Track the scene and content
    ctx.session.lastSceneId = ctx.scene.current?.id
    ctx.session.lastContent = text
  }
}
```

### Updating Keyboard

Keyboard changes when user state changes (registered vs unregistered):

```typescript
// Unregistered user
await TwoMessageManager.updateKeyboard(ctx, [
  ['📝 Register'],
  ['ℹ️ Info']
])

// Registered user
await TwoMessageManager.updateKeyboard(ctx, [
  ['👤 Profile', '💪 Log Activity'],
  ['📊 Statistics', 'ℹ️ Info'],
  ['💬 Feedback']
])
```

## Navigation

### Scene Navigation

```typescript
// Navigate with message cleanup
await TwoMessageManager.navigateToScene(ctx, 'profile')
```

This:
1. Deletes user's message (keeps chat clean)
2. Enters the specified scene
3. Scene's `.enter()` handler updates content message

### Direct Scene Entry

For programmatic navigation without deleting user messages:

```typescript
// Enter scene without cleanup (from .enter() hooks)
await TwoMessageManager.enterScene(ctx, 'stats_menu')
```

### Keyboard Button Handler

```typescript
static async handleNavigation(ctx: any, buttonText: string) {
  const navigationMap: Record<string, string> = {
    '📝 Register': 'register_wizard',
    'ℹ️ Info': 'info_menu',
    '👤 Profile': 'profile',
    '💪 Log Activity': 'activity_wizard',
    '📊 Statistics': 'stats_menu',
    '💬 Feedback': 'feedback_wizard'
  }

  const targetScene = navigationMap[buttonText]
  if (targetScene) {
    await this.navigateToScene(ctx, targetScene)
    return true
  }
  
  return false
}
```

## Escape Middleware

Allows users to exit wizards/scenes at any time:

```typescript
activityWizard.use(TwoMessageManager.createEscapeMiddleware())
```

This middleware intercepts:
1. `/start` command → Returns to main menu
2. Reply keyboard buttons → Navigates to different scenes

```typescript
static createEscapeMiddleware() {
  return async (ctx: any, next: any) => {
    // Only intercept if we have a text message
    if (!ctx.message || !('text' in ctx.message)) {
      return next()
    }

    const messageText = ctx.message.text

    // Check for /start command
    if (messageText === '/start') {
      // Clear any wizard state if in a wizard
      if (ctx.wizard) {
        ctx.wizard.state = {}
      }
      
      // Navigate to menu router
      await this.deleteUserMessage(ctx)
      await ctx.scene.enter('menu_router')
      return
    }
    
    // Check for reply keyboard navigation
    const navigationMap: Record<string, string> = {
      '📝 Register': 'register_wizard',
      'ℹ️ Info': 'info_menu',
      '👤 Profile': 'profile',
      '💪 Log Activity': 'activity_wizard',
      '📊 Statistics': 'stats_menu',
      '💬 Feedback': 'feedback_wizard'
    }

    const targetScene = navigationMap[messageText]
    
    // Only intercept if it's a navigation button AND we're not already entering that scene
    if (targetScene && ctx.scene.current?.id !== targetScene) {
      // Clear wizard state if in a wizard
      if (ctx.wizard) {
        ctx.wizard.state = {}
      }
      
      // Navigate away
      await this.deleteUserMessage(ctx)
      await ctx.scene.enter(targetScene)
      return
    }
    
    // If not a navigation command, continue to next middleware/handler
    return next()
  }
}
```

## User Message Cleanup

Delete user messages to keep chat clean:

```typescript
static async deleteUserMessage(ctx: any) {
  try {
    if (ctx.message?.message_id) {
      await ctx.deleteMessage()
    }
  } catch (error) {
    // Silently ignore if deletion fails
  }
}
```

User messages are deleted:
- When navigating between scenes
- After processing commands
- When entering wizards

## Cleanup

When user starts fresh or bot restarts:

```typescript
static async cleanup(ctx: any) {
  const messagesToDelete = [
    ctx.session?.contentMessageId,
    ctx.session?.keyboardMessageId
  ]

  for (const messageId of messagesToDelete) {
    if (messageId) {
      try {
        await ctx.telegram.deleteMessage(ctx.chat.id, messageId)
      } catch (error) {
        // Silently ignore deletion errors
      }
    }
  }

  delete ctx.session.contentMessageId
  delete ctx.session.keyboardMessageId
  delete ctx.session.lastSceneId
  delete ctx.session.lastContent
}
```

## Usage Examples

### Scene with Two-Message Manager

```typescript
const profileScene = new Scenes.BaseScene('profile')

profileScene.enter(async (ctx) => {
  const user = await getUserByTelegramId(ctx.from.id)
  
  await TwoMessageManager.updateContent(
    ctx,
    `👤 *Your Profile*\n\nName: ${user.first_name}\nPoints: ${user.points}`,
    Markup.inlineKeyboard([
      [Markup.button.callback('📜 Activity History', 'profile:history')],
      [Markup.button.callback('🏠 Main Menu', 'nav:menu')]
    ])
  )
})

profileScene.action('nav:menu', async (ctx) => {
  await ctx.answerCbQuery()
  await ctx.scene.enter('registered_menu')
})
```

### Wizard with Two-Message Manager

```typescript
const activityWizard = new Scenes.WizardScene(
  'activity_wizard',
  
  // Step 0: Category selection
  async (ctx) => {
    await TwoMessageManager.updateContent(
      ctx,
      '📋 Select a category:',
      Markup.inlineKeyboard([
        [Markup.button.callback('🚴 Bicycling', 'cat:Bicycling')],
        [Markup.button.callback('⚽ Sports', 'cat:Sports')],
        [Markup.button.callback('❌ Cancel', 'cat:cancel')]
      ])
    )
    return ctx.wizard.next()
  },
  
  // Step 1: Handle category
  async (ctx) => {
    const category = ctx.callbackQuery.data.replace('cat:', '')
    ctx.wizard.state.category = category
    
    await TwoMessageManager.updateContent(
      ctx,
      `Selected: ${category}\n\nChoose subcategory:`,
      // ... subcategory buttons
    )
    return ctx.wizard.next()
  }
)

// Add escape middleware
activityWizard.use(TwoMessageManager.createEscapeMiddleware())
```

## Benefits

### For Users

1. **Clean Interface**: No message clutter
2. **Easy Navigation**: Keyboard always accessible at bottom
3. **No Scrolling**: Current information always visible
4. **Consistent Layout**: Same structure in every scene

### For Developers

1. **Centralized Logic**: All message management in one class
2. **Error Handling**: Automatic fallback if message edit fails
3. **Deduplication**: Prevents redundant updates
4. **Easy Navigation**: Simple scene transitions

### For Performance

1. **Fewer API Calls**: Edit existing messages instead of creating new ones
2. **Reduced Storage**: Telegram stores fewer messages
3. **Faster Response**: No need to scroll to find information

## Trade-offs

### Limitations

1. **Session Required**: Depends on session storage (in-memory)
2. **Single Conversation**: One flow per user (can't handle multiple simultaneous conversations)
3. **Message Age**: Telegram limits editing messages older than 48 hours
4. **No History**: Past states aren't visible (intentional design choice)

### When Not to Use

1. **Broadcasting**: Sending messages to multiple users
2. **Notifications**: Alert messages that should persist
3. **Conversation History**: When past context is important
4. **Multi-user Chats**: Group chats with multiple participants

The Two-Message Manager is optimized for **single-user, form-like interactions** in private chats.

## Error Handling

### Message Edit Failures

If `editMessageText()` fails (message too old, deleted, or doesn't exist):

```typescript
try {
  await ctx.telegram.editMessageText(...)
} catch (error) {
  // Create new message as fallback
  const newMsg = await ctx.reply(text)
  ctx.session.contentMessageId = newMsg.message_id
}
```

### Missing Session Data

If session data is lost (bot restart):

```typescript
if (!ctx.session?.contentMessageId) {
  // Reinitialize the two messages
  await TwoMessageManager.init(ctx)
}
```

### Telegram API Errors

All Telegram API calls wrapped in try-catch with silent error handling for cleanup operations (deletion errors are non-critical).

## Testing

Mock the context and session:

```typescript
const mockContext = {
  session: {},
  from: { id: 123 },
  chat: { id: 123 },
  reply: jest.fn(),
  telegram: {
    editMessageText: jest.fn(),
    deleteMessage: jest.fn()
  },
  scene: {
    current: { id: 'test_scene' }
  }
}

// Test initialization
await TwoMessageManager.init(mockContext)
expect(mockContext.session.contentMessageId).toBeDefined()
expect(mockContext.session.keyboardMessageId).toBeDefined()

// Test content update
await TwoMessageManager.updateContent(mockContext, 'Test content')
expect(mockContext.telegram.editMessageText).toHaveBeenCalled()
```

## Best Practices

1. **Always initialize** at bot start: `await TwoMessageManager.init(ctx)`
2. **Use `updateContent()`** in scene `.enter()` hooks
3. **Add escape middleware** to all wizards
4. **Clean up user messages** after processing
5. **Handle keyboard changes** when user state changes
6. **Use inline keyboards** for scene-specific actions
7. **Keep reply keyboard** for main navigation only
8. **Don't create additional messages** during normal operation
9. **Use deduplication** to prevent unnecessary updates
10. **Test error scenarios** (missing session, edit failures)

## Future Enhancements

Potential improvements:
1. **Redis Session Storage**: Persist sessions across bot restarts
2. **Message Versioning**: Track message history for debugging
3. **Multi-Message Support**: Allow specific scenes to use more than 2 messages
4. **Animation Support**: Smooth transitions between content updates
5. **Message Templates**: Predefined layouts for common patterns