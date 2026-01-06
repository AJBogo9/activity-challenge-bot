# Testing Guide

Testing reference for the Activity Challenge Bot using Bun's built-in test runner.

> **Note**: For Bun test runner basics, see [Bun Testing](https://bun.sh/docs/cli/test). This guide covers our project-specific patterns.

## Running Tests

```bash
bun test                  # Run all tests once
bun run test:watch        # Watch mode
bun run test:coverage     # With coverage
bun run pod:test          # In container
```

## Test Structure

Tests in `tests/` directory:

```
tests/
├── leaderboard.test.ts
├── ranking.test.ts
├── points.test.ts
└── activities.test.ts
```

**Naming**: `feature.test.ts`

## Example Test

```typescript
import { describe, test, expect, beforeEach, afterEach } from 'bun:test'

describe('User Rankings', () => {
  beforeEach(() => {
    // Setup
  })
  
  afterEach(() => {
    // Cleanup
  })
  
  test('should calculate rankings correctly', () => {
    const users = [
      { id: 1, points: 100 },
      { id: 2, points: 200 },
      { id: 3, points: 150 }
    ]
    
    const ranked = rankUsers(users)
    
    expect(ranked[0].rank).toBe(1)
    expect(ranked[0].id).toBe(2)  // Highest points
  })
})
```

## Testing Patterns

### Unit Testing

```typescript
import { calculatePoints } from '../src/db/points'

test('should calculate points correctly', () => {
  const points = calculatePoints(8.0, 30)  // MET, duration
  expect(points).toBe(4.0)  // (8.0 × 30) / 60
})
```

### Integration Testing (with Database)

```typescript
import { sql } from '../src/db'

describe('Activity Logging', () => {
  let testUserId: number
  
  beforeEach(async () => {
    const [user] = await sql`
      INSERT INTO users (telegram_id, username, guild, points)
      VALUES ('test123', 'testuser', 'TestGuild', 0)
      RETURNING id
    `
    testUserId = user.id
  })
  
  afterEach(async () => {
    await sql`DELETE FROM users WHERE telegram_id = 'test123'`
  })
  
  test('should log activity and update points', async () => {
    await logActivity({
      userId: testUserId,
      activityType: 'Running',
      duration: 30,
      points: 4.0,
      activityDate: new Date()
    })
    
    const points = await getUserPoints(testUserId)
    expect(points).toBe(4.0)
  })
})
```

### Mocking Telegram Context

```typescript
function createMockContext(overrides = {}) {
  return {
    from: { id: 123, username: 'testuser' },
    reply: mock(() => Promise.resolve()),
    answerCbQuery: mock(() => Promise.resolve()),
    wizard: { state: {}, next: mock() },
    ...overrides
  }
}

test('should handle button click', async () => {
  const ctx = createMockContext({
    callbackQuery: { data: 'action:test' }
  })
  
  await handleButtonClick(ctx)
  
  expect(ctx.answerCbQuery).toHaveBeenCalled()
})
```

## Test Data

### Using Fixtures

```typescript
// tests/fixtures/users.ts
export const testUsers = [
  { telegram_id: 'test1', username: 'alice', guild: 'Guild1', points: 100 },
  { telegram_id: 'test2', username: 'bob', guild: 'Guild2', points: 150 }
]

// Use in tests
import { testUsers } from './fixtures/users'

test('should rank users correctly', () => {
  const ranked = rankUsers(testUsers)
  expect(ranked[0].username).toBe('bob')
})
```

### Database Seeding

```typescript
export async function seedTestData() {
  for (const user of testUsers) {
    await sql`INSERT INTO users ${sql(user)}`
  }
}

export async function clearTestData() {
  await sql`DELETE FROM activities`
  await sql`DELETE FROM users`
}

beforeEach(seedTestData)
afterEach(clearTestData)
```

## Coverage

```bash
bun run test:coverage
```

**Goals:**
- Functions: 80%+
- Branches: 70%+
- Lines: 80%+

**Priority areas:** Point calculations, database operations, user flows

## Manual Testing Checklist

### Registration
- [ ] Terms acceptance required
- [ ] Guild selection works
- [ ] Confirmation shows correct data
- [ ] Can cancel at each step

### Activity Logging
- [ ] All 4 hierarchy levels work
- [ ] Date picker validates competition period
- [ ] Duration validates numbers
- [ ] Points calculated correctly
- [ ] Can cancel at each step

### Profile
- [ ] Stats display correctly
- [ ] Activity history works
- [ ] Delete account requires confirmation

## Debugging Tests

```bash
# Run specific test file
bun test tests/ranking.test.ts

# Run specific test by name
bun test --test-name-pattern "should calculate rankings"

# Use console.log
test('should do something', () => {
  console.log('Debug:', someVariable)
  expect(true).toBe(true)
})
```

## Best Practices

✅ Write tests for critical business logic
✅ Test edge cases (zero, negative, large values)
✅ Keep tests independent
✅ Clean up test data
✅ Mock external dependencies

❌ Don't test third-party libraries
❌ Don't write order-dependent tests
❌ Don't use production database
❌ Don't commit failing tests

## Common Test Patterns

### Testing Async Functions
```typescript
test('should handle async', async () => {
  const result = await asyncFunction()
  expect(result).toBeDefined()
})
```

### Testing Errors
```typescript
test('should throw error', () => {
  expect(() => validateInput(invalid)).toThrow('Invalid input')
})

test('should handle async errors', async () => {
  await expect(asyncFunction()).rejects.toThrow('Error')
})
```

### Testing Edge Cases
```typescript
describe('Point Calculation Edge Cases', () => {
  test('handles zero values', () => {
    expect(calculatePoints(0, 30)).toBe(0)
    expect(calculatePoints(8, 0)).toBe(0)
  })
  
  test('handles large values', () => {
    expect(calculatePoints(20, 180)).toBe(60)
  })
  
  test('handles decimal precision', () => {
    expect(calculatePoints(7.5, 45)).toBeCloseTo(5.63, 2)
  })
})
```

## Next Steps

- Review [Code Patterns](/development/patterns)
- Understand [Project Structure](/development/project-structure)
- Read [Contributing Guidelines](/CONTRIBUTING)