# Testing Guide

This guide covers how to write and run tests for the Activity Challenge Bot.

## Test Framework

The project uses **Bun's built-in test runner**, which provides:
- Fast test execution
- TypeScript support out of the box
- Jest-compatible API
- No additional configuration needed

## Running Tests

### Basic Commands

```bash
# Run all tests once
bun test

# Run tests in watch mode (re-runs on file changes)
bun run test:watch

# Run tests with coverage report
bun run test:coverage
```

### Container Testing

```bash
# Run tests inside container
bun run pod:test

# Run tests in Kubernetes
bun run cluster:test
```

## Test Structure

### Test File Organization

Tests live in the `tests/` directory and mirror the source structure:

```
tests/
├── leaderboard.test.ts      # Leaderboard logic
├── ranking.test.ts          # Ranking calculations
├── points.test.ts           # Point calculations (future)
└── activities.test.ts       # Activity data (future)
```

### File Naming

- Use `.test.ts` suffix: `feature.test.ts`
- Match source file names when testing specific modules
- Group related tests in describe blocks

### Example Test File

```typescript
import { describe, test, expect, beforeEach, afterEach } from 'bun:test'

describe('User Rankings', () => {
  beforeEach(() => {
    // Setup before each test
  })
  
  afterEach(() => {
    // Cleanup after each test
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
  
  test('should handle ties correctly', () => {
    const users = [
      { id: 1, points: 100 },
      { id: 2, points: 100 },
      { id: 3, points: 100 }
    ]
    
    const ranked = rankUsers(users)
    
    // All users should have same rank
    expect(ranked.every(u => u.rank === 1)).toBe(true)
  })
})
```

## Testing Patterns

### Unit Testing

Test individual functions in isolation.

**Example: Testing Point Calculation**

```typescript
import { describe, test, expect } from 'bun:test'
import { calculatePoints } from '../src/db/points'

describe('Point Calculation', () => {
  test('should calculate points correctly', () => {
    const metValue = 8.0    // Running MET value
    const duration = 30     // 30 minutes
    
    const points = calculatePoints(metValue, duration)
    
    // Formula: (MET × duration) / 60
    expect(points).toBe(4.0)
  })
  
  test('should round to 2 decimal places', () => {
    const points = calculatePoints(7.5, 45)
    
    expect(points).toBe(5.63)  // Not 5.625
  })
  
  test('should handle zero duration', () => {
    const points = calculatePoints(8.0, 0)
    
    expect(points).toBe(0)
  })
})
```

### Integration Testing

Test how multiple components work together.

**Example: Testing Activity Logging Flow**

```typescript
import { describe, test, expect, beforeEach, afterEach } from 'bun:test'
import { logActivity } from '../src/db/activities'
import { getUserPoints } from '../src/db/users'
import { sql } from '../src/db'

describe('Activity Logging Integration', () => {
  let testUserId: number
  
  beforeEach(async () => {
    // Create test user
    const [user] = await sql`
      INSERT INTO users (telegram_id, username, guild, points)
      VALUES ('test123', 'testuser', 'TestGuild', 0)
      RETURNING id
    `
    testUserId = user.id
  })
  
  afterEach(async () => {
    // Clean up test data
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

### Database Testing

Test database operations with test data.

**Best Practices**:
- Use test database (set `NODE_ENV=test`)
- Clean up after each test
- Use transactions when possible

```typescript
import { describe, test, expect, beforeEach, afterEach } from 'bun:test'
import { sql } from '../src/db'

describe('User Database Operations', () => {
  beforeEach(async () => {
    // Setup test data
    await sql`
      INSERT INTO users (telegram_id, username, guild)
      VALUES ('test1', 'user1', 'Guild1'),
             ('test2', 'user2', 'Guild2')
    `
  })
  
  afterEach(async () => {
    // Clean up
    await sql`DELETE FROM users WHERE telegram_id LIKE 'test%'`
  })
  
  test('should find user by telegram_id', async () => {
    const [user] = await sql`
      SELECT * FROM users WHERE telegram_id = 'test1'
    `
    
    expect(user).toBeDefined()
    expect(user.username).toBe('user1')
  })
})
```

## Mocking

### Mocking Database Calls

```typescript
import { describe, test, expect, mock } from 'bun:test'

describe('Activity Handler with Mocked DB', () => {
  test('should handle activity logging', async () => {
    // Mock the database function
    const mockLogActivity = mock(() => Promise.resolve({ id: 1 }))
    
    // Use the mock
    const result = await mockLogActivity({
      userId: 1,
      activityType: 'Running',
      duration: 30,
      points: 4.0
    })
    
    expect(mockLogActivity).toHaveBeenCalledTimes(1)
    expect(result.id).toBe(1)
  })
})
```

### Mocking Telegram Context

```typescript
import { describe, test, expect } from 'bun:test'

function createMockContext(overrides = {}) {
  return {
    from: { id: 123, username: 'testuser' },
    reply: mock(() => Promise.resolve()),
    answerCbQuery: mock(() => Promise.resolve()),
    wizard: {
      state: {},
      next: mock(),
    },
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

## Test Data Management

### Using Test Fixtures

Create reusable test data:

```typescript
// tests/fixtures/users.ts
export const testUsers = [
  {
    telegram_id: 'test1',
    username: 'alice',
    first_name: 'Alice',
    guild: 'Guild1',
    points: 100
  },
  {
    telegram_id: 'test2',
    username: 'bob',
    first_name: 'Bob',
    guild: 'Guild2',
    points: 150
  }
]

// Use in tests
import { testUsers } from './fixtures/users'

test('should rank users correctly', () => {
  const ranked = rankUsers(testUsers)
  expect(ranked[0].username).toBe('bob')
})
```

### Database Seeding for Tests

```typescript
import { sql } from '../src/db'
import { testUsers } from './fixtures/users'

export async function seedTestData() {
  for (const user of testUsers) {
    await sql`
      INSERT INTO users ${sql(user)}
    `
  }
}

export async function clearTestData() {
  await sql`DELETE FROM activities`
  await sql`DELETE FROM users`
}

// Use in tests
beforeEach(async () => {
  await seedTestData()
})

afterEach(async () => {
  await clearTestData()
})
```

## Coverage

### Generating Coverage Reports

```bash
bun run test:coverage
```

This generates:
- Console output with coverage percentages
- HTML report in `coverage/` directory

### Coverage Goals

Aim for:
- **Functions**: 80%+ coverage
- **Branches**: 70%+ coverage
- **Lines**: 80%+ coverage

Priority areas:
- Point calculation logic
- Database operations
- User flow validation

## Testing Telegram Interactions

### Manual Testing Checklist

Use this checklist when testing bot changes manually:

#### Registration Flow
- [ ] Can register new user
- [ ] Terms acceptance required
- [ ] Guild selection works
- [ ] Confirmation shows correct data
- [ ] Can cancel at each step
- [ ] /start escapes wizard

#### Activity Logging Flow
- [ ] Category navigation works
- [ ] Subcategory navigation works
- [ ] Activity selection works
- [ ] Intensity selection works
- [ ] Date picker works (today, yesterday, other)
- [ ] Duration input validates numbers
- [ ] Confirmation shows all details correctly
- [ ] Points calculated correctly
- [ ] Can cancel at each step
- [ ] /start escapes wizard

#### Profile Features
- [ ] View profile shows correct data
- [ ] Activity history displays correctly
- [ ] Delete account works
- [ ] Delete account requires confirmation

#### Stats Features
- [ ] Personal stats display correctly
- [ ] Guild rankings display correctly
- [ ] Top performers display correctly

### Automated E2E Testing (Future)

For more comprehensive testing, consider adding:
- Telegram Bot API mock server
- Automated conversation flow testing
- Screenshot comparison testing

## Continuous Integration

### GitHub Actions (Future)

Example workflow for running tests on push:

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: testdb
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v3
      
      - uses: oven-sh/setup-bun@v1
        with:
          bun-version: latest
      
      - run: bun install
      
      - run: bun test
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/testdb
          BOT_TOKEN: test-token
```

## Debugging Tests

### Running a Single Test

```bash
# Run specific test file
bun test tests/ranking.test.ts

# Run specific test by name
bun test --test-name-pattern "should calculate rankings"
```

### Using Console Logs

```typescript
test('should do something', () => {
  console.log('Debug info:', someVariable)
  expect(true).toBe(true)
})
```

Logs appear in terminal output.

### Using Debugger

Add `debugger` statement:

```typescript
test('should do something', () => {
  debugger  // Execution pauses here
  const result = calculateSomething()
  expect(result).toBe(expected)
})
```

Run with inspector:

```bash
bun --inspect-brk test
```

## Common Testing Patterns

### Testing Async Functions

```typescript
test('should handle async operation', async () => {
  const result = await asyncFunction()
  expect(result).toBeDefined()
})
```

### Testing Errors

```typescript
test('should throw error for invalid input', () => {
  expect(() => {
    validateInput(invalidData)
  }).toThrow('Invalid input')
})

test('should handle async errors', async () => {
  await expect(asyncFunction()).rejects.toThrow('Error message')
})
```

### Testing Edge Cases

```typescript
describe('Point Calculation Edge Cases', () => {
  test('should handle zero values', () => {
    expect(calculatePoints(0, 30)).toBe(0)
    expect(calculatePoints(8, 0)).toBe(0)
  })
  
  test('should handle very large values', () => {
    const points = calculatePoints(20, 180)  // 3 hours, high intensity
    expect(points).toBe(60)
  })
  
  test('should handle decimal precision', () => {
    const points = calculatePoints(7.5, 45)
    expect(points).toBeCloseTo(5.63, 2)
  })
})
```

## Best Practices

### Do's
- ✅ Write tests for critical business logic
- ✅ Test edge cases and error conditions
- ✅ Keep tests independent (no shared state)
- ✅ Use descriptive test names
- ✅ Clean up test data
- ✅ Mock external dependencies
- ✅ Run tests before committing

### Don'ts
- ❌ Don't test third-party libraries
- ❌ Don't write tests that depend on test order
- ❌ Don't use production database for tests
- ❌ Don't commit failing tests
- ❌ Don't skip tests to make CI pass
- ❌ Don't test implementation details

## Next Steps

- Review [Code Patterns](/development/patterns)
- Understand [Project Structure](/development/project-structure)
- Learn about [Database Operations](/architecture/database)
- Read [Contributing Guidelines](/CONTRIBUTING)