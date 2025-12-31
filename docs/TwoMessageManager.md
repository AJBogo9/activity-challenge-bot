# TwoMessageManager Refactoring Guide

## Overview
This guide helps you systematically refactor all navigation files to use `TwoMessageManager` for consistent message handling across your Telegram bot.

## Core Principles

### 1. Two-Message System
- **Content Message**: Updated with `TwoMessageManager.updateContent()` - contains dynamic content and inline keyboards
- **Keyboard Message**: Updated with `TwoMessageManager.updateKeyboard()` - contains persistent reply keyboard (stays at bottom)

### 2. When to Use What

#### Use `TwoMessageManager.init(ctx)`
- When entering the main menu (registered/unregistered)
- This creates BOTH messages fresh

#### Use `TwoMessageManager.updateContent(ctx, text, keyboard?)`
- For ALL scene content updates
- For inline keyboards (navigation within flows)
- For displaying information

#### Use `TwoMessageManager.updateKeyboard(ctx, buttons, text?)`
- Only when changing the persistent reply keyboard
- Typically only in menu scenes for different user states

#### Use `TwoMessageManager.deleteUserMessage(ctx)`
- In wizards when user sends text input
- Keeps chat clean by removing user messages

#### Use `TwoMessageManager.cleanup(ctx)`
- Rarely needed (handled by init)
- Only if you need to manually clear messages

## Files Refactored

### ✅ Already Refactored
1. `src/flows/menu/registered-menu.ts` - Uses init + updateKeyboard
2. `src/flows/menu/unregistered-menu.ts` - Uses init + updateKeyboard
3. `src/flows/profile/profile-menu.ts` - Uses updateContent
4. `src/flows/stats/stats-menu.ts` - Uses updateContent
5. `src/flows/info/info-menu.ts` - Uses updateContent
6. `src/flows/info/about.ts` - Uses updateContent

### 🔄 Files Updated in This Refactoring (Batch 1)

#### 1. `src/flows/activity/helpers/navigation.ts`
**Changes:**
- Added `TwoMessageManager.deleteUserMessage(ctx)` before returning to menu
- Removed manual keyboard creation (handled by registered_menu)

**Why:**
- Cleans up user messages before returning
- Lets registered_menu reinitialize the system properly

#### 2. `src/flows/activity/steps/7-confirm.ts`
**Changes:**
- No changes needed! Already returns to `registered_menu` which handles reinitialization

**Why:**
- The scene transition automatically triggers registered_menu.enter()
- That scene calls `TwoMessageManager.init()` which sets up fresh messages

#### 3. `src/flows/feedback.ts`
**Changes:**
- Replaced all `ctx.editMessageText()` with `TwoMessageManager.updateContent()`
- Replaced all `ctx.replyWithMarkdown()` with `TwoMessageManager.updateContent()`
- Added `TwoMessageManager.deleteUserMessage()` when user sends text
- Removed manual keyboard building (handled by registered_menu on return)
- Added small delays before returning to menu for better UX

**Why:**
- Consistent message management throughout wizard
- Clean chat by deleting user text inputs
- Proper reinitialization when returning to menu

#### 4. `src/flows/profile/delete.ts`
**Changes:**
- Replaced all `ctx.editMessageText()` with `TwoMessageManager.updateContent()`
- Replaced `ctx.replyWithMarkdown()` with `TwoMessageManager.updateContent()`
- Added `TwoMessageManager.deleteUserMessage()` for text inputs
- Added delays before redirects for better UX

**Why:**
- Consistent message updates
- Better user feedback before scene transitions
- Clean chat management

### 🔄 Files Updated in This Refactoring (Batch 2)

#### 5. `src/flows/profile/activity-history.ts`
**Changes:**
- Replaced all `ctx.editMessageText()` and `ctx.replyWithMarkdown()` with `TwoMessageManager.updateContent()`
- Added `TwoMessageManager.deleteUserMessage()` for text inputs (silent cleanup)
- Removed manual callback/reply branching logic (TwoMessageManager handles it)
- Kept multi-chunk handling for long activity lists but simplified first chunk update

**Why:**
- Handles both callback queries and direct entries consistently
- Simplifies code by removing branching
- Clean chat by silently deleting user messages

#### 6. `src/flows/profile/user-profile-info.ts`
**Changes:**
- Replaced all `ctx.editMessageText()` and `ctx.replyWithMarkdown()` with `TwoMessageManager.updateContent()`
- Added `TwoMessageManager.deleteUserMessage()` for text inputs
- Removed manual callback/reply branching

**Why:**
- Consistent message handling
- Simplified code (removed 10+ lines of branching logic)
- Clean chat management

#### 7. `src/flows/stats/user-summary.ts`
**Changes:**
- Replaced `ctx.editMessageText()` and `ctx.replyWithMarkdownV2()` with `TwoMessageManager.updateContent()`
- Added `TwoMessageManager.deleteUserMessage()` for text inputs
- Removed manual callback/reply branching
- Fixed missing backtick in original code (pts formatting)

**Why:**
- Consistent with other stat scenes
- Simplified code structure
- Works with MarkdownV2 (TwoMessageManager uses parse_mode from updateContent call)

## Common Patterns

### Pattern 1: Scene Enter (Menu/Info Scenes)
```typescript
sceneInstance.enter(async (ctx: any) => {
  const message = 'Your content here'
  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback('Option', 'action:option')]
  ])
  
  await TwoMessageManager.updateContent(ctx, message, keyboard)
  
  // Answer callback if entering from button
  if (ctx.callbackQuery) {
    await ctx.answerCbQuery()
  }
})
```

### Pattern 2: Wizard Steps
```typescript
async (ctx: any) => {
  // Handle user input
  if (ctx.message?.text) {
    await TwoMessageManager.deleteUserMessage(ctx)
    // Process input...
  }
  
  // Update content
  await TwoMessageManager.updateContent(
    ctx,
    'Next step content',
    Markup.inlineKeyboard([...])
  )
  
  return ctx.wizard.next()
}
```

### Pattern 3: Returning to Main Menu
```typescript
// Just enter the scene - it handles reinitialization
await ctx.scene.enter('registered_menu')

// Or with a delay for user feedback
await new Promise(resolve => setTimeout(resolve, 2000))
await ctx.scene.enter('registered_menu')
```

### Pattern 4: Cancel Handler
```typescript
export async function handleCancel(ctx: any): Promise<void> {
  await TwoMessageManager.deleteUserMessage(ctx)
  await ctx.scene.enter('registered_menu')
}
```

## Files Still Using Old Patterns (To Review)

### Registration Wizard
- `src/flows/register/wizard.ts` and its steps
- **Review needed:** Check if they properly return to menu_router
- **Note:** Registration creates keyboards manually - might need refactoring

### Other Scene Files (Check if already using TwoMessageManager)
- `src/flows/stats/top-users.ts`
- `src/flows/stats/guild-inner-leaderboard.ts`
- `src/flows/stats/guild-outer-leaderboard.ts`
- `src/flows/info/points.ts`
- `src/flows/info/terms.ts`
- `src/flows/info/credits.ts`

## Testing Checklist

After refactoring each file, test:

1. ✅ Scene enters correctly
2. ✅ Content updates properly
3. ✅ Buttons work and navigate correctly
4. ✅ User text messages get deleted (where applicable)
5. ✅ Returning to main menu reinitializes properly
6. ✅ Cancel actions work
7. ✅ No duplicate messages appear
8. ✅ Keyboard stays at bottom consistently

## Common Issues & Solutions

### Issue: Duplicate messages
**Solution:** Ensure only one message creation method is used - prefer `updateContent`

### Issue: Keyboard not showing
**Solution:** Check if scene is calling `init()` or if keyboard was removed

### Issue: Old messages not clearing
**Solution:** Ensure scene transitions go through registered_menu which calls `init()`

### Issue: User messages piling up
**Solution:** Add `TwoMessageManager.deleteUserMessage(ctx)` in text handlers

## Benefits of This Refactoring

1. **Consistency**: All navigation uses the same pattern
2. **Clean Chat**: User messages are deleted, bot messages are updated
3. **Maintainability**: One source of truth for message management
4. **User Experience**: Persistent keyboard at bottom, clean content updates
5. **Debugging**: Easier to track message flow

## Next Steps

1. Apply the refactored files from the artifacts
2. Test each flow thoroughly
3. Review remaining scene files (activity-history, user-summary, etc.)
4. Apply similar patterns to any files still using old methods
5. Consider adding error handling for edge cases