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

**Priority areas:** Point calculations, database operations, user flows

## Debugging Tests

```bash
# Run specific test file
bun test tests/ranking.test.ts

# Run specific test by name
bun test --test-name-pattern "should calculate rankings"
```

## Next Steps

- Understand [Project Structure](/development/project-structure)